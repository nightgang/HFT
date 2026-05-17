jest.mock('../services/alerting/alerting.service', () => ({
  sendAlert: jest.fn().mockResolvedValue(undefined)
}));

const errorHandlingService = require('../services/resilience/error-handling.service');
const alertingService = require('../services/alerting/alerting.service');

describe('ErrorHandlingService', () => {
  beforeEach(() => {
    alertingService.sendAlert.mockReset();
    errorHandlingService.errorCounts = {};
    errorHandlingService.errorThresholds = {
      critical: 10,
      error: 1,
      warning: 100
    };
  });

  test('should send an alert when error threshold is exceeded', () => {
    errorHandlingService.trackErrorCount('test_error', 'error');
    errorHandlingService.trackErrorCount('test_error', 'error');

    expect(alertingService.sendAlert).toHaveBeenCalledTimes(1);
    expect(alertingService.sendAlert).toHaveBeenCalledWith(
      'high',
      expect.stringContaining('Error threshold exceeded'),
      expect.any(String),
      expect.objectContaining({
        errorType: 'test_error',
        severity: 'error',
        count: 2
      })
    );
  });
});
