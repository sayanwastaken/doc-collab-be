import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserModule } from './users/user.module';
import { YSocketIoGateway } from './collab/y-socketio.gateway';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    UserModule,
  ],
  controllers: [AppController],
  providers: [AppService, YSocketIoGateway],
})
export class AppModule {}
