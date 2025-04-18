import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

    // CORS para permitir apenas o front-end
    app.enableCors({
      origin: 'https://gerador-desculpas-openai-fronten-production.up.railway.app',
    });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
