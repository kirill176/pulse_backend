import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { JWTAuthGuard } from '@modules/auth/guards/jwt-auth.guard';

async function bootstrap() {
  const PORT = process.env.PORT ?? 5000;
  console.log('p', PORT);

  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  await app.listen(PORT, () => console.log(`Server starts on port ${PORT}`));
}

bootstrap();
