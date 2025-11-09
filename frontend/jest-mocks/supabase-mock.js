/**
 * Supabase Package Mock
 * 
 * Mocks the @supabase packages for Jest testing
 * Prevents ES module import errors
 */

const mockClient = {
  auth: {
    getSession: jest.fn(),
    onAuthStateChange: jest.fn(),
    signUp: jest.fn(),
    signInWithPassword: jest.fn(),
    signOut: jest.fn(),
  },
  from: jest.fn(() => ({
    select: jest.fn().mockResolvedValue({ data: [], error: null }),
    insert: jest.fn().mockResolvedValue({ data: [], error: null }),
    update: jest.fn().mockResolvedValue({ data: [], error: null }),
    delete: jest.fn().mockResolvedValue({ data: [], error: null }),
  })),
  rpc: jest.fn().mockResolvedValue({ data: null, error: null }),
};

module.exports = {
  createClient: jest.fn(() => mockClient),
  default: {
    createClient: jest.fn(() => mockClient),
  },
};

Object.keys(module.exports).forEach((key) => {
  module.exports[key] = module.exports[key];
});
