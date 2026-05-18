import { Module } from '@nestjs/common';
import { ShiftReportService } from './shift-report.service';
import { ShiftReportController } from './shift-report.controller';
import { WhatsappModule } from '../whatsapp/whatsapp.module';

@Module({
  imports: [WhatsappModule],
  providers: [ShiftReportService],
  controllers: [ShiftReportController],
  exports: [ShiftReportService],
})
export class ShiftReportModule {}
