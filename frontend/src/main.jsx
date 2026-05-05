import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider, MutationCache } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import App from './App.jsx';
import './index.css';
import './main.css';
import './i18n/config.js';

const queryClient = new QueryClient({
  mutationCache: new MutationCache({
    onSuccess: (_data, _variables, _context, mutation) => {
      // Automatically refresh relevant data after any successful mutation
      
      // 1. Refresh universal student/user statistics and profile info
      queryClient.invalidateQueries({ queryKey: ['account-overview'] });
      
      // 2. Refresh public event lists
      queryClient.invalidateQueries({ queryKey: ['events'] });
      
      // 3. Refresh management lists (Organizer & Admin dashboard lists)
      queryClient.invalidateQueries({ queryKey: ['my-events'] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-events'] });
      queryClient.invalidateQueries({ queryKey: ['pending-events'] });
      
      // 4. Refresh individual entity details if a mutationKey was provided
      // (e.g., ['event', id] or ['participants', id])
      if (mutation.options.mutationKey) {
        queryClient.invalidateQueries({ queryKey: mutation.options.mutationKey });
      }
    },
  }),
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
        <Toaster position="top-right" />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
