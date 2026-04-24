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
}));

// beforeEach(() => {
//   mockReset(prisma);
// });

module.exports = { prismaMock: prisma };
