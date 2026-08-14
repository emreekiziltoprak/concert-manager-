"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderStatus = exports.EventRoleType = exports.EventStatus = exports.TicketCategory = exports.UserRole = exports.PrismaClient = exports.Prisma = void 0;
// The only module allowed to reference ../../generated/prisma. The client is
// generated to a custom output, so @prisma/client cannot resolve model types.
var prisma_1 = require("../../generated/prisma");
Object.defineProperty(exports, "Prisma", { enumerable: true, get: function () { return prisma_1.Prisma; } });
Object.defineProperty(exports, "PrismaClient", { enumerable: true, get: function () { return prisma_1.PrismaClient; } });
var prisma_2 = require("../../generated/prisma");
Object.defineProperty(exports, "UserRole", { enumerable: true, get: function () { return prisma_2.UserRole; } });
Object.defineProperty(exports, "TicketCategory", { enumerable: true, get: function () { return prisma_2.TicketCategory; } });
Object.defineProperty(exports, "EventStatus", { enumerable: true, get: function () { return prisma_2.EventStatus; } });
Object.defineProperty(exports, "EventRoleType", { enumerable: true, get: function () { return prisma_2.EventRoleType; } });
Object.defineProperty(exports, "OrderStatus", { enumerable: true, get: function () { return prisma_2.OrderStatus; } });
//# sourceMappingURL=prisma.js.map