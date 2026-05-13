# Scripts

This directory contains setup and utility scripts for the HFT project.

## Files

- `setup.sh` - Main setup script for initial project configuration
- `.git-pre-commit-hook.sh` - Git pre-commit hook for code quality checks

## Usage

### Setup Script

```bash
# Run the main setup script
./scripts/setup.sh
```

### Git Hook

The pre-commit hook is automatically installed when you run the setup script. It performs:

- Code linting
- Type checking
- Test execution
- Security checks

## Adding New Scripts

When adding new scripts:

1. Make them executable: `chmod +x script-name.sh`
2. Add proper error handling
3. Include usage documentation
4. Test on multiple environments if applicable