import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { ThemeProvider } from '@/context/ThemeContext';
import { ThemeToggle } from '@/components/layout/ThemeToggle';

describe('ThemeToggle', () => {
  it('renders a Light label in light mode and switches to dark on click', () => {
    render(
      <ThemeProvider>
        <ThemeToggle variant="pill" />
      </ThemeProvider>
    );

    const button = screen.getByRole('button', { name: /switch to dark mode/i });
    expect(button).toHaveTextContent('Light');

    fireEvent.click(button);

    expect(screen.getByRole('button', { name: /switch to light mode/i })).toHaveTextContent(
      'Dark'
    );
    // Persisted through the provider
    expect(window.localStorage.getItem('gymflow_theme')).toBe('dark');
  });

  it('icon variant exposes an accessible aria-label', () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );

    expect(screen.getByRole('button', { name: /switch to dark mode/i })).toBeInTheDocument();
  });
});
