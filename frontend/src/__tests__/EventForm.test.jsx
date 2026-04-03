/**
 * Creation flow tests for organizer/admin event form.
 * Ensures the page does not crash and submission sends a valid payload.
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import EventForm from '../components/organizer/EventForm.jsx';

vi.mock('../api/events.js', () => ({
  getFaculties: vi.fn(() => Promise.resolve({ data: [{ id: 1, name: 'FIESC', short_name: 'FIESC' }] })),
  getCategories: vi.fn(() => Promise.resolve({ data: [{ id: 10, name: 'Workshop' }] })),
  getDepartments: vi.fn(() => Promise.resolve({ data: [{ id: 100, name: 'Calculatoare' }] })),
}));

function renderForm(props = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return render(
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>
        <EventForm onSubmit={vi.fn()} submitting={false} {...props} />
      </QueryClientProvider>
    </MemoryRouter>
  );
}

describe('EventForm create flow', () => {
  it('renders lookup options from API without crashing (no blank page)', async () => {
    renderForm();

    await waitFor(() => {
      expect(screen.getByText('FIESC')).toBeTruthy();
      expect(screen.getByText('Workshop')).toBeTruthy();
    });
  });

  it('submits valid payload for organizer/admin create event', async () => {
    const onSubmit = vi.fn();
    renderForm({ onSubmit });

    fireEvent.change(screen.getByPlaceholderText('Event title'), { target: { value: 'Eveniment Test' } });
    fireEvent.change(screen.getByPlaceholderText('Describe the event...'), { target: { value: 'Descriere test' } });

    const dateTimeInputs = document.querySelectorAll('input[type="datetime-local"]');
    fireEvent.change(dateTimeInputs[0], { target: { value: '2026-03-20T10:00' } });
    fireEvent.change(dateTimeInputs[1], { target: { value: '2026-03-20T12:00' } });

    fireEvent.click(screen.getByRole('button', { name: 'Save Event' }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    const payload = onSubmit.mock.calls[0][0];
    expect(payload.title).toBe('Eveniment Test');
    expect(payload.description).toBe('Descriere test');
    expect(payload.participation_mode).toBe('physical');
    expect(payload.faculty_id).toBeNull();
    expect(payload.department_id).toBeNull();
    expect(payload.category_id).toBeNull();
  });
});
