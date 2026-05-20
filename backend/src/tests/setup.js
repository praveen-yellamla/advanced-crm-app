const { mockDeep, mockReset } = require('jest-mock-extended');
const prisma = require('../config/prisma');

// Mock the Prisma client
jest.mock('../config/prisma', () => ({
  __esModule: true,
  default: mockDeep(),
  user: mockDeep(),
  team: mockDeep(),
  lead: mockDeep(),
  task: mockDeep(),
  call: mockDeep(),
  session: mockDeep(),
  auditLog: mockDeep(),
}));

// Mock the uuid library to bypass ES module import issues in Jest environment
jest.mock('uuid', () => ({
  v4: () => 'mocked-uuid-v4-value-12345'
}));

// beforeEach(() => {
//   mockReset(prisma);
// });

module.exports = { prismaMock: prisma };
