// Minimal smoke test - no explicit imports (relies on globals: true)
describe('environment smoke test', () => {
  it('can run a basic test', () => {
    expect(1 + 1).toBe(2);
  });

  it('has localStorage available', () => {
    localStorage.setItem('test', 'value');
    expect(localStorage.getItem('test')).toBe('value');
    localStorage.clear();
  });

  it('has window defined', () => {
    expect(typeof window).toBe('object');
  });
});
