import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import UserManagementPage from '../pages/admin/UserManagementPage.jsx';

const mockGetUsers = vi.fn(() => Promise.resolve({ data: { items: [], total: 0 } }));
const mockCreateUser = vi.fn(() => Promise.resolve({ data: { id: 'new-user' } }));

vi.mock('../api/admin', () => ({
  getUsers: (...args) => mockGetUsers(...args),
  createUser: (...args) => mockCreateUser(...args),
  activateUser: vi.fn(),
  deactivateUser: vi.fn(),
  assignUserRole: vi.fn(),
}));

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return render(
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>
        <UserManagementPage />
      </QueryClientProvider>
    </MemoryRouter>
  );
}

describe('UserManagementPage', () => {
  beforeEach(() => {
    mockGetUsers.mockClear();
    mockCreateUser.mockClear();
  });

  it('validates required fields before create', async () => {
    renderPage();

    fireEvent.click(screen.getByRole('button', { name: /utilizator nou/i }));
    fireEvent.click(screen.getByRole('button', { name: /salvează/i }));

    await waitFor(() => {
      expect(screen.getByText(/completează toate câmpurile/i)).toBeTruthy();
    });

    expect(mockCreateUser).not.toHaveBeenCalled();
  });

  it('creates user and trims fields', async () => {
    renderPage();

    fireEvent.click(screen.getByRole('button', { name: /utilizator nou/i }));

    fireEvent.change(screen.getByPlaceholderText('Nume complet'), { target: { value: '  User Test  ' } });
    fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: '  user_test  ' } });
    fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: '  user@test.ro  ' } });
    fireEvent.change(screen.getByPlaceholderText('Parolă'), { target: { value: 'secret123' } });

    fireEvent.click(screen.getByRole('button', { name: /salvează/i }));

    await waitFor(() => {
      expect(mockCreateUser).toHaveBeenCalledTimes(1);
    });

    expect(mockCreateUser.mock.calls[0][0]).toEqual({
      username: 'user_test',
      email: 'user@test.ro',
      full_name: 'User Test',
      password: 'secret123',
    });

    await waitFor(() => {
      expect(screen.getByText(/a fost creat cu succes/i)).toBeTruthy();
    });
  });
});
