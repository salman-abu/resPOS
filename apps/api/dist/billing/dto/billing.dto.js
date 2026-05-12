"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CloseShiftDto = exports.OpenShiftDto = exports.SettleInvoiceDto = exports.RecordPaymentDto = exports.GenerateInvoiceDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class GenerateInvoiceDto {
    order_id;
    discount;
    discount_type;
    discount_approved_by;
    service_charge;
}
exports.GenerateInvoiceDto = GenerateInvoiceDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], GenerateInvoiceDto.prototype, "order_id", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], GenerateInvoiceDto.prototype, "discount", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(['PERCENT', 'FLAT']),
    __metadata("design:type", String)
], GenerateInvoiceDto.prototype, "discount_type", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GenerateInvoiceDto.prototype, "discount_approved_by", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], GenerateInvoiceDto.prototype, "service_charge", void 0);
class RecordPaymentDto {
    amount;
    method;
    upi_ref;
    transaction_id;
}
exports.RecordPaymentDto = RecordPaymentDto;
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], RecordPaymentDto.prototype, "amount", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(['CASH', 'CARD', 'UPI', 'WALLET', 'COMPLIMENTARY']),
    __metadata("design:type", String)
], RecordPaymentDto.prototype, "method", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RecordPaymentDto.prototype, "upi_ref", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RecordPaymentDto.prototype, "transaction_id", void 0);
class SettleInvoiceDto {
    payments;
}
exports.SettleInvoiceDto = SettleInvoiceDto;
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => RecordPaymentDto),
    __metadata("design:type", Array)
], SettleInvoiceDto.prototype, "payments", void 0);
class OpenShiftDto {
    opening_float;
}
exports.OpenShiftDto = OpenShiftDto;
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], OpenShiftDto.prototype, "opening_float", void 0);
class CloseShiftDto {
    closing_float;
    petty_cash;
}
exports.CloseShiftDto = CloseShiftDto;
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CloseShiftDto.prototype, "closing_float", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CloseShiftDto.prototype, "petty_cash", void 0);
//# sourceMappingURL=billing.dto.js.map