import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import UserManagementPage from '../pages/admin/UserManagementPage.jsx';

const mockGetUsers = vi.fn(() => Promise.resolve({ data: { items: [], total: 0 } }));
const mockCreateUser = vi.fn(() => Promise.resolve({ data: { id: 'new-user' } }));
const mockDeleteUser = vi.fn(() => Promise.resolve({ data: {} }));

vi.mock('../api/admin', () => ({
  getUsers: (...args) => mockGetUsers(...args),
  createUser: (...args) => mockCreateUser(...args),
  activateUser: vi.fn(),
  deactivateUser: vi.fn(),
  deleteUser: (...args) => mockDeleteUser(...args),
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
    mockDeleteUser.mockClear();
  });

  it('validates required fields before create', async () => {
    renderPage();

    fireEvent.click(screen.getByRole('button', { name: /new user/i }));
    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(screen.getByText(/fill in all fields to create a user/i)).toBeTruthy();
    });

    expect(mockCreateUser).not.toHaveBeenCalled();
  });

  it('creates user and trims fields', async () => {
    renderPage();

    fireEvent.click(screen.getByRole('button', { name: /new user/i }));

    fireEvent.change(screen.getByPlaceholderText('Full name'), { target: { value: '  User Test  ' } });
    fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: '  user_test  ' } });
    fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: '  user@test.ro  ' } });
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'secret123' } });

    fireEvent.click(screen.getByRole('button', { name: /save/i }));

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
      expect(screen.getByText(/user created successfully/i)).toBeTruthy();
    });
  });

  it('keeps delete disabled for active users', async () => {
    mockGetUsers.mockResolvedValueOnce({
      data: {
        items: [
          {
            id: 'user-1',
            full_name: 'Active User',
            email: 'active@usv.ro',
            role: 'student',
            is_active: true,
            account_type: 'local',
          },
        ],
        total: 1,
      },
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Active User')).toBeTruthy();
    });

    expect(screen.getByRole('button', { name: /delete/i })).toBeDisabled();
    expect(mockDeleteUser).not.toHaveBeenCalled();
  });
});
