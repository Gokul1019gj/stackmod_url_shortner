import app from './app';
import { config } from './config';

app.listen(config.port, () => {
  console.log(`[${config.nodeEnv}] URL Shortener running on http://localhost:${config.port}`);
});
