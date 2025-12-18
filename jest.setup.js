import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: {},
      asPath: '/',
      push: jest.fn(),
      pop: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn(),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
    }
  },
}))

// Mock window.crypto for Node.js environment
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => 'test-uuid-' + Math.random().toString(36).substr(2, 9),
    getRandomValues: (arr) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256)
      }
      return arr
    }
  }
})

// Mock localStorage with actual storage behavior (only in browser environment)
const localStorageMock = (() => {
  let store = {}
  return {
    getItem: jest.fn((key) => {
      return key in store ? store[key] : null
    }),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString()
    }),
    removeItem: jest.fn((key) => {
      delete store[key]
    }),
    clear: jest.fn(() => {
      store = {}
    }),
    get length() {
      return Object.keys(store).length
    },
    key: jest.fn((index) => {
      const keys = Object.keys(store)
      return keys[index] || null
    })
  }
})()

// Only mock browser APIs if window is defined (jsdom environment)
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    writable: true
  })

  // Mock sessionStorage with actual storage behavior
  const sessionStorageMock = (() => {
    let store = {}
    return {
      getItem: jest.fn((key) => {
        return key in store ? store[key] : null
      }),
      setItem: jest.fn((key, value) => {
        store[key] = value.toString()
      }),
      removeItem: jest.fn((key) => {
        delete store[key]
      }),
      clear: jest.fn(() => {
        store = {}
      }),
      get length() {
        return Object.keys(store).length
      },
      key: jest.fn((index) => {
        const keys = Object.keys(store)
        return keys[index] || null
      })
    }
  })()
  
  Object.defineProperty(window, 'sessionStorage', {
    value: sessionStorageMock,
    writable: true
  })
}

// Mock document.cookie (only in browser environment)
if (typeof document !== 'undefined') {
  Object.defineProperty(document, 'cookie', {
    writable: true,
    value: '',
  })
}

// Mock fetch
global.fetch = jest.fn()

// Mock Request and Response for Next.js API routes
global.Request = class Request {
  constructor(input, init) {
    this.url = typeof input === 'string' ? input : input.url
    this.method = init?.method || 'GET'
    this.headers = new Map(Object.entries(init?.headers || {}))
    this.body = init?.body
  }
}

global.Response = class Response {
  constructor(body, init) {
    this.body = body
    this.status = init?.status || 200
    this.statusText = init?.statusText || 'OK'
    this.headers = new Map(Object.entries(init?.headers || {}))
  }
  
  json() {
    return Promise.resolve(typeof this.body === 'string' ? JSON.parse(this.body) : this.body)
  }
  
  static json(data, init) {
    const response = new Response(JSON.stringify(data), init)
    response._jsonData = data
    return response
  }
}

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}

// Mock TransformStream for edge runtime compatibility
global.TransformStream = class TransformStream {
  constructor() {
    this.readable = {}
    this.writable = {}
  }
}

// Mock environment variables
process.env.NODE_ENV = 'test'
process.env.JWT_SECRET = 'test-jwt-secret'

// Reset all mocks before each test
beforeEach(() => {
  jest.clearAllMocks()
  if (typeof window !== 'undefined') {
    localStorageMock.clear()
    if (window.sessionStorage) {
      window.sessionStorage.clear()
    }
  }
  if (typeof document !== 'undefined') {
    document.cookie = ''
  }
  if (global.fetch && global.fetch.mockClear) {
    global.fetch.mockClear()
  }
})