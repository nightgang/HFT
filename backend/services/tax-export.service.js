const logger = require('../utils/logger');
const fs = require('fs').promises;
const path = require('path');
const PDFDocument = require('pdfkit');
const cacheService = require('./cache.service');

class TaxExportService {
  constructor() {
    this.exportsDir = path.join(__dirname, '../../exports');
    this.ensureExportsDir();
  }

  /**
   * Ensure exports directory exists
   */
  async ensureExportsDir() {
    try {
      await fs.mkdir(this.exportsDir, { recursive: true });
    } catch (error) {
      logger.error('Failed to create exports directory:', error);
    }
  }

  /**
   * Generate tax-friendly trade export
   * @param {string} walletId - Wallet ID
   * @param {string} format - Export format ('csv' or 'pdf')
   * @param {number} year - Tax year
   * @returns {Promise<Object>} Export result
   */
  async generateTaxExport(walletId, format = 'csv', year = new Date().getFullYear()) {
    try {
      logger.info(`📄 Generating ${format.toUpperCase()} tax export for wallet ${walletId} (${year})`);

      const cacheKey = `tax_export:${walletId}:${year}:${format}`;
      const cached = await cacheService.get(cacheKey);

      if (cached) {
        return cached;
      }

      // Get trade data for the year
      const trades = await this.getTradesForTaxYear(walletId, year);

      if (!trades || trades.length === 0) {
        return {
          success: false,
          error: 'No trade data available for the specified year'
        };
      }

      // Process trades for tax reporting
      const processedTrades = this.processTradesForTax(trades);

      // Generate export file
      const fileName = `tax_report_${walletId}_${year}.${format}`;
      const filePath = path.join(this.exportsDir, fileName);

      if (format === 'csv') {
        await this.generateCSVExport(processedTrades, filePath);
      } else if (format === 'pdf') {
        await this.generatePDFExport(processedTrades, filePath, walletId, year);
      } else {
        throw new Error('Unsupported export format');
      }

      const result = {
        success: true,
        walletId,
        year,
        format,
        fileName,
        filePath,
        recordCount: processedTrades.length,
        totalVolume: processedTrades.reduce((sum, trade) => sum + trade.amountUSD, 0),
        generatedAt: Date.now(),
        downloadUrl: `/api/trading/exports/${fileName}` // Would be served by static file middleware
      };

      // Cache result for 1 hour
      await cacheService.set(cacheKey, result, 3600);

      logger.info(`📄 Tax export generated: ${fileName} (${processedTrades.length} records)`);

      return result;

    } catch (error) {
      logger.error(`Error generating tax export for ${walletId}:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get trades for tax year
   * @param {string} walletId - Wallet ID
   * @param {number} year - Tax year
   * @returns {Promise<Array>} Trades for the year
   */
  async getTradesForTaxYear(walletId, year) {
    try {
      // In a real implementation, this would query the database
      // For now, we'll simulate with generated data
      const cacheKey = `trades_tax_year:${walletId}:${year}`;
      const cached = await cacheService.get(cacheKey);

      if (cached) {
        return cached;
      }

      // Generate mock trades for the year
      const mockTrades = this.generateMockTaxTrades(walletId, year);

      // Cache for 1 hour
      await cacheService.set(cacheKey, mockTrades, 3600);

      return mockTrades;

    } catch (error) {
      logger.error(`Error getting tax trades for ${walletId}:`, error);
      return [];
    }
  }

  /**
   * Generate mock trades for tax reporting
   * @param {string} walletId - Wallet ID
   * @param {number} year - Tax year
   * @returns {Array} Mock trades
   */
  generateMockTaxTrades(walletId, year) {
    const trades = [];
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);

    // Generate 200-500 random trades for the year
    const numTrades = Math.floor(Math.random() * 300) + 200;

    for (let i = 0; i < numTrades; i++) {
      const randomTime = startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime());
      const date = new Date(randomTime);

      const trade = {
        tradeId: `tax_trade_${year}_${i}`,
        walletId,
        date: date.toISOString().split('T')[0],
        timestamp: date.getTime(),
        type: Math.random() > 0.5 ? 'BUY' : 'SELL',
        asset: Math.random() > 0.7 ? 'SOL' : 'USDC', // Mostly SOL and USDC for simplicity
        amount: Math.random() * 100 + 1,
        price: Math.random() * 200 + 50, // $50-250 range
        amountUSD: 0, // Will be calculated
        fee: Math.random() * 5 + 0.1, // $0.1-5 fee
        exchange: 'Jupiter',
        txHash: `tx_${Date.now()}_${i}`
      };

      // Calculate USD amount
      trade.amountUSD = trade.amount * trade.price;

      trades.push(trade);
    }

    // Sort by date
    trades.sort((a, b) => a.timestamp - b.timestamp);

    return trades;
  }

  /**
   * Process trades for tax reporting
   * @param {Array} trades - Raw trades
   * @returns {Array} Processed trades
   */
  processTradesForTax(trades) {
    return trades.map(trade => ({
      date: trade.date,
      type: trade.type,
      asset: trade.asset,
      amount: Math.round(trade.amount * 100) / 100,
      price: Math.round(trade.price * 100) / 100,
      amountUSD: Math.round(trade.amountUSD * 100) / 100,
      fee: Math.round(trade.fee * 100) / 100,
      exchange: trade.exchange,
      txHash: trade.txHash,
      // Tax-specific fields
      costBasis: trade.type === 'BUY' ? trade.amountUSD + trade.fee : 0,
      proceeds: trade.type === 'SELL' ? trade.amountUSD - trade.fee : 0,
      gainLoss: 0 // Would be calculated based on cost basis tracking
    }));
  }

  /**
   * Generate CSV export
   * @param {Array} trades - Processed trades
   * @param {string} filePath - Output file path
   */
  async generateCSVExport(trades, filePath) {
    const headers = [
      'Date',
      'Type',
      'Asset',
      'Amount',
      'Price',
      'Amount USD',
      'Fee',
      'Exchange',
      'Transaction Hash',
      'Cost Basis',
      'Proceeds',
      'Gain/Loss'
    ];

    const csvContent = [
      headers.join(','),
      ...trades.map(trade => [
        trade.date,
        trade.type,
        trade.asset,
        trade.amount,
        trade.price,
        trade.amountUSD,
        trade.fee,
        trade.exchange,
        trade.txHash,
        trade.costBasis,
        trade.proceeds,
        trade.gainLoss
      ].join(','))
    ].join('\n');

    await fs.writeFile(filePath, csvContent, 'utf8');
  }

  /**
   * Generate PDF export
   * @param {Array} trades - Processed trades
   * @param {string} filePath - Output file path
   * @param {string} walletId - Wallet ID
   * @param {number} year - Tax year
   */
  async generatePDFExport(trades, filePath, walletId, year) {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument();
      const stream = require('fs').createWriteStream(filePath);

      doc.pipe(stream);

      // Header
      doc.fontSize(20).text(`Tax Report ${year}`, { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Wallet: ${walletId}`);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`);
      doc.moveDown();

      // Summary
      const totalTrades = trades.length;
      const totalVolume = trades.reduce((sum, trade) => sum + trade.amountUSD, 0);
      const totalFees = trades.reduce((sum, trade) => sum + trade.fee, 0);

      doc.fontSize(14).text('Summary:');
      doc.fontSize(10);
      doc.text(`Total Trades: ${totalTrades}`);
      doc.text(`Total Volume: $${totalVolume.toLocaleString()}`);
      doc.text(`Total Fees: $${totalFees.toFixed(2)}`);
      doc.moveDown();

      // Table headers
      const tableTop = doc.y;
      const colWidths = [60, 40, 50, 50, 50, 60, 50];

      doc.fontSize(8);
      doc.text('Date', 50, tableTop);
      doc.text('Type', 110, tableTop);
      doc.text('Asset', 150, tableTop);
      doc.text('Amount', 200, tableTop);
      doc.text('Price', 250, tableTop);
      doc.text('Amount USD', 300, tableTop);
      doc.text('Fee', 360, tableTop);

      doc.moveTo(50, tableTop + 15).lineTo(410, tableTop + 15).stroke();

      // Table rows
      let y = tableTop + 25;
      trades.slice(0, 100).forEach(trade => { // Limit to first 100 for PDF
        if (y > 700) { // New page if needed
          doc.addPage();
          y = 50;
        }

        doc.text(trade.date, 50, y);
        doc.text(trade.type, 110, y);
        doc.text(trade.asset, 150, y);
        doc.text(trade.amount.toString(), 200, y);
        doc.text(`$${trade.price}`, 250, y);
        doc.text(`$${trade.amountUSD}`, 300, y);
        doc.text(`$${trade.fee}`, 360, y);

        y += 15;
      });

      // Footer
      doc.fontSize(8).text(
        'This report is for tax purposes only. Consult with a tax professional for accurate reporting.',
        50, 750, { align: 'center' }
      );

      doc.end();

      stream.on('finish', resolve);
      stream.on('error', reject);
    });
  }

  /**
   * List available exports
   * @param {string} walletId - Wallet ID
   * @returns {Promise<Array>} List of exports
   */
  async listExports(walletId) {
    try {
      const files = await fs.readdir(this.exportsDir);
      const walletFiles = files.filter(file => file.includes(walletId));

      const walletExports = await Promise.all(walletFiles.map(async (file) => {
        const stats = await fs.stat(path.join(this.exportsDir, file));
        return {
          fileName: file,
          size: stats.size,
          createdAt: stats.birthtime,
          downloadUrl: `/api/trading/exports/${file}`
        };
      }));

      return walletExports;

    } catch (error) {
      logger.error(`Error listing exports for ${walletId}:`, error);
      return [];
    }
  }

  /**
   * Clean up old exports (older than 30 days)
   */
  async cleanupOldExports() {
    try {
      const files = await fs.readdir(this.exportsDir);
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);

      for (const file of files) {
        const filePath = path.join(this.exportsDir, file);
        const stats = await fs.stat(filePath);

        if (stats.mtime.getTime() < thirtyDaysAgo) {
          await fs.unlink(filePath);
          logger.info(`Cleaned up old export: ${file}`);
        }
      }

    } catch (error) {
      logger.error('Error cleaning up old exports:', error);
    }
  }
}

module.exports = new TaxExportService();