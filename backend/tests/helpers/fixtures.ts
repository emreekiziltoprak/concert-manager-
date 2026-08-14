import { randomUUID } from "crypto";
import jwt from "jsonwebtoken";
import prisma from "../../src/utils/prismaClient";
import type {
  Category,
  Event,
  EventRole,
  Order,
  OrderItem,
  Prisma,
  TicketType,
  User
} from "../../generated/prisma";
import {
  EventRoleType,
  EventStatus,
  OrderStatus,
  TicketCategory,
  UserRole
} from "../../generated/prisma";

// Overrides mirror the Prisma create inputs, so a field the schema does not have
// is a compile error rather than a silently ignored property.
type CategoryOverrides = Partial<Pick<Category, "name" | "slug">>;

type UserOverrides = Partial<Pick<User, "email" | "passwordHash" | "fullName" | "role">>;

type EventOverrides = Partial<
  Pick<
    Event,
    | "organizerId"
    | "categoryId"
    | "title"
    | "slug"
    | "description"
    | "startDate"
    | "endDate"
    | "address"
    | "capacity"
    | "status"
  >
> & {
  latitude?: number;
  longitude?: number;
};

type TicketTypeOverrides = Partial<Pick<TicketType, "eventId" | "name" | "category">> & {
  price?: number;
  totalCount?: number;
};

interface EventRoleInput {
  eventId: string;
  userId: string;
  assignedById?: string;
  role?: EventRoleType;
}

interface OrderInput {
  userId: string;
  eventId: string;
  ticketTypeId: string;
  quantity?: number;
  status?: OrderStatus;
  unitPrice?: number;
}

export const createTestCategory = (overrides: CategoryOverrides = {}): Promise<Category> => {
  const unique = randomUUID();
  return prisma.category.create({
    data: {
      name: overrides.name || `Test Category ${unique}`,
      slug: overrides.slug || `test-category-${unique}`
    }
  });
};

export const createTestUser = (overrides: UserOverrides = {}): Promise<User> => {
  const unique = randomUUID();
  return prisma.user.create({
    data: {
      email: overrides.email || `test-user-${unique}@example.com`,
      passwordHash: overrides.passwordHash || "$2a$10$dummyHashForTestsOnly",
      fullName: overrides.fullName || `Test User ${unique}`,
      role: overrides.role || UserRole.USER
    }
  });
};

export const createTestEvent = async (overrides: EventOverrides = {}): Promise<Event> => {
  const unique = randomUUID();
  const organizerId = overrides.organizerId || (await createTestUser()).id;
  const categoryId = overrides.categoryId || (await createTestCategory()).id;

  return prisma.event.create({
    data: {
      organizerId,
      categoryId,
      title: overrides.title || "Test Event",
      slug: overrides.slug || `test-event-${unique}`,
      description: overrides.description || "Test event description",
      startDate: overrides.startDate || new Date(Date.now() + 24 * 60 * 60 * 1000),
      endDate: overrides.endDate || new Date(Date.now() + 25 * 60 * 60 * 1000),
      address: overrides.address || "Test Address 1",
      latitude: overrides.latitude ?? 41.0,
      longitude: overrides.longitude ?? 29.0,
      capacity: overrides.capacity ?? 100,
      status: overrides.status || EventStatus.PUBLISHED
    }
  });
};

export const createTestTicketType = async (
  overrides: TicketTypeOverrides = {}
): Promise<TicketType> => {
  const eventId = overrides.eventId || (await createTestEvent()).id;

  return prisma.ticketType.create({
    data: {
      eventId,
      name: overrides.name || "Standard",
      price: overrides.price ?? 100,
      totalCount: overrides.totalCount ?? 10,
      category: overrides.category || TicketCategory.STANDARD
    }
  });
};

export const createTestEventRole = ({
  eventId,
  userId,
  assignedById,
  role = EventRoleType.CO_ORGANISER
}: EventRoleInput): Promise<EventRole> =>
  prisma.eventRole.create({
    data: {
      eventId,
      userId,
      assignedById: assignedById || userId,
      role
    }
  });

// An order plus its single order item, which is what makes a ticket type
// "reserved" (PENDING/SUCCESS) and blocks a hard delete.
export const createTestOrder = ({
  userId,
  eventId,
  ticketTypeId,
  quantity = 1,
  status = OrderStatus.PENDING,
  unitPrice = 100
}: OrderInput): Promise<Order & { orderItems: OrderItem[] }> =>
  prisma.order.create({
    data: {
      userId,
      eventId,
      status,
      totalAmount: unitPrice * quantity,
      orderItems: {
        create: {
          ticketTypeId,
          quantity,
          unitPrice,
          totalPrice: unitPrice * quantity
        }
      }
    },
    include: { orderItems: true }
  });

// Mirrors the production token payload (see authService) so role-gated routes
// authorize test users the same way they authorize real ones.
export const createAuthToken = (user: Pick<User, "id" | "role" | "email">): string =>
  jwt.sign(
    { userId: user.id, role: user.role, email: user.email },
    process.env.JWT_SECRET as string
  );

export type { Prisma };
