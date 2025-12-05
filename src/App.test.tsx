import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import App from './App';

// Mock the page components to simplify App testing
vi.mock('./pages/TeacherView', () => ({
  default: () => <div data-testid="teacher-view">Teacher View</div>
}));

vi.mock('./pages/StudentView', () => ({
  default: () => <div data-testid="student-view">Student View</div>
}));

describe('App', () => {
  it('redirects root to teacher view', () => {
    // Note: Since we are using BrowserRouter in App.tsx, we can't easily test initial route
    // unless we wrap it or change App to accept initial entries.
    // However, window.location.pathname defaults to '/' in jsdom.

    render(<App />);
    expect(screen.getByTestId('teacher-view')).toBeInTheDocument();
  });

  // To test routing more thoroughly, we would typically extract the Routes part
  // or use MemoryRouter for testing. But for a basic sanity check:

  it('renders without crashing', () => {
      render(<App />);
      // Should find at least one of the views (TeacherView by default redirect)
      expect(screen.getByTestId('teacher-view')).toBeInTheDocument();
  });
});
