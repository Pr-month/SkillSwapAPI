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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersController = void 0;
const common_1 = require("@nestjs/common");
const accessToken_guard_1 = require("../auth/guards/accessToken.guard");
const update_users_dto_1 = require("./dto/update.users.dto");
const users_service_1 = require("./users.service");
const swagger_1 = require("@nestjs/swagger");
const users_entity_1 = require("./entities/users.entity");
let UsersController = class UsersController {
    usersService;
    constructor(usersService) {
        this.usersService = usersService;
    }
    findAll() {
        return this.usersService.findAll();
    }
    findCurrentUser(req) {
        return this.usersService.findOne(req.user.sub);
    }
    updateUser(req, updateUserDto) {
        return this.usersService.updateUser(req.user.sub, updateUserDto);
    }
    updatePassword(req, password) {
        return this.usersService.updatePassword(req.user.sub, password);
    }
    findOne(id) {
        return this.usersService.findOne(id);
    }
    remove(id) {
        return this.usersService.remove(id);
    }
};
exports.UsersController = UsersController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Получение всех пользователей' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Список пользователей',
        type: users_entity_1.User,
        isArray: true,
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "findAll", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(accessToken_guard_1.AccessTokenGuard),
    (0, common_1.Get)('me'),
    (0, swagger_1.ApiOperation)({
        summary: 'Получение текущего пользователя',
        description: 'ТОКЕН БЕРЁМ ИЗ ОТВЕТА ПРИ РЕГИСТРАЦИИ',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Данные текущего пользователя',
        type: users_entity_1.User,
    }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "findCurrentUser", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(accessToken_guard_1.AccessTokenGuard),
    (0, common_1.Patch)('me'),
    (0, swagger_1.ApiOperation)({
        summary: 'Обновление данных текущего пользователя',
        description: 'ТОКЕН БЕРЁМ ИЗ ОТВЕТА ПРИ РЕГИСТРАЦИИ',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Данные текущего пользователя',
        type: users_entity_1.User,
    }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, update_users_dto_1.UpdateUsersDto]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "updateUser", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(accessToken_guard_1.AccessTokenGuard),
    (0, common_1.Patch)('me/password'),
    (0, swagger_1.ApiOperation)({
        summary: 'Обновление пароля текущего пользователя',
        description: 'ТОКЕН БЕРЁМ ИЗ ОТВЕТА ПРИ РЕГИСТРАЦИИ',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Данные текущего пользователя',
    }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)('password')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "updatePassword", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({
        summary: 'Получение пользователя по ID',
        description: 'ID берём из GET/users',
    }),
    (0, swagger_1.ApiParam)({
        name: 'id',
        description: 'Уникальный идентификатор пользователя для тестовой базы',
        example: 'e59c23dc-b405-4eae-9bae-c8e3a2078d44',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Данные пользователя',
        type: users_entity_1.User,
    }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "findOne", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({
        summary: 'Удаление пользователя по ID',
        description: 'ID берём из GET/users',
    }),
    (0, swagger_1.ApiParam)({
        name: 'id',
        description: 'Уникальный идентификатор пользователя для тестовой базы',
        example: 'e59c23dc-b405-4eae-9bae-c8e3a2078d44',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Данные пользователя',
        schema: {
            example: {
                message: 'Пользователь с id e59c23dc-b405-4eae-9bae-c8e3a2078d44 удалён',
            },
        },
    }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "remove", null);
exports.UsersController = UsersController = __decorate([
    (0, common_1.Controller)('users'),
    __metadata("design:paramtypes", [users_service_1.UsersService])
], UsersController);
//# sourceMappingURL=users.controller.js.map