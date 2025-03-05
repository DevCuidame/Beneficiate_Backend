// Aumentar el timeout para tests asíncronos
jest.setTimeout(10000);

// Limpiar todos los timers después de cada prueba
afterEach(() => {
  jest.useRealTimers();
});

// Evitar que console.log interfiera con los resultados de Jest
global.console = {
  ...console,
  // Mantener solo el log original para debug si es necesario
  log: jest.fn(),
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
};