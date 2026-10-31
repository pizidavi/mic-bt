import { consoleTransport, logger } from 'react-native-logs';

const log = logger.createLogger({
  transport: consoleTransport,
  severity: 'debug',
  transportOptions: {
    colors: {
      info: 'blueBright',
      warn: 'yellowBright',
      error: 'redBright',
    },
  },
});

export const appLog = log.extend('APP');
