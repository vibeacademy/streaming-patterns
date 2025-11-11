/**
 * Input Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from './Input';

describe('Input', () => {
  describe('Rendering', () => {
    it('should render input field', () => {
      render(<Input placeholder="Enter text" />);
      expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
    });

    it('should render with label', () => {
      render(<Input label="Username" />);
      expect(screen.getByLabelText('Username')).toBeInTheDocument();
    });

    it('should show required indicator when required', () => {
      render(<Input label="Email" required />);
      expect(screen.getByText('*')).toBeInTheDocument();
      const input = screen.getByLabelText(/email/i);
      expect(input).toBeRequired();
    });

    it('should render with helper text', () => {
      render(<Input helperText="Enter your username" />);
      expect(screen.getByText('Enter your username')).toBeInTheDocument();
    });

    it('should render with error message', () => {
      render(<Input error="This field is required" />);
      expect(screen.getByRole('alert')).toHaveTextContent('This field is required');
    });

    it('should not show helper text when error is present', () => {
      render(<Input helperText="Helper text" error="Error message" />);
      expect(screen.queryByText('Helper text')).not.toBeInTheDocument();
      expect(screen.getByText('Error message')).toBeInTheDocument();
    });
  });

  describe('Sizes', () => {
    it('should render with small size', () => {
      render(<Input inputSize="sm" placeholder="Small input" />);
      expect(screen.getByPlaceholderText('Small input')).toBeInTheDocument();
    });

    it('should render with medium size by default', () => {
      render(<Input placeholder="Medium input" />);
      expect(screen.getByPlaceholderText('Medium input')).toBeInTheDocument();
    });

    it('should render with large size', () => {
      render(<Input inputSize="lg" placeholder="Large input" />);
      expect(screen.getByPlaceholderText('Large input')).toBeInTheDocument();
    });
  });

  describe('Full Width', () => {
    it('should render full width when fullWidth is true', () => {
      render(<Input fullWidth placeholder="Full width input" />);
      expect(screen.getByPlaceholderText('Full width input')).toBeInTheDocument();
    });
  });

  describe('Icons', () => {
    it('should render with start icon', () => {
      render(
        <Input startIcon={<span data-testid="start-icon">📧</span>} placeholder="With start icon" />
      );
      expect(screen.getByTestId('start-icon')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('With start icon')).toBeInTheDocument();
    });

    it('should render with end icon', () => {
      render(
        <Input endIcon={<span data-testid="end-icon">🔍</span>} placeholder="With end icon" />
      );
      expect(screen.getByTestId('end-icon')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('With end icon')).toBeInTheDocument();
    });
  });

  describe('States', () => {
    it('should be disabled when disabled prop is true', () => {
      render(<Input label="Disabled Input" disabled />);
      const input = screen.getByLabelText('Disabled Input');
      expect(input).toBeDisabled();
    });

    it('should show error state', () => {
      render(<Input error="Invalid input" placeholder="Error input" />);
      expect(screen.getByRole('alert')).toHaveTextContent('Invalid input');
    });

    it('should have aria-invalid when error is present', () => {
      render(<Input label="Email" error="Invalid email" />);
      const input = screen.getByLabelText('Email');
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });
  });

  describe('User Interaction', () => {
    it('should call onChange when user types', async () => {
      const handleChange = vi.fn();
      const user = userEvent.setup();

      render(<Input onChange={handleChange} />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'test');

      expect(handleChange).toHaveBeenCalled();
    });

    it('should update value when controlled', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();

      render(<Input value="initial" onChange={handleChange} />);

      const input = screen.getByRole('textbox');
      expect(input).toHaveValue('initial');

      await user.type(input, 'test');

      expect(handleChange).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should link label to input with htmlFor', () => {
      render(<Input label="Test Label" id="test-input" />);
      const label = screen.getByText('Test Label');
      const input = screen.getByLabelText('Test Label');
      expect(label).toHaveAttribute('for', 'test-input');
      expect(input).toHaveAttribute('id', 'test-input');
    });

    it('should generate unique ID when not provided', () => {
      render(<Input label="Auto ID" />);
      const input = screen.getByLabelText('Auto ID');
      expect(input).toHaveAttribute('id');
    });

    it('should link error message with aria-describedby', () => {
      render(<Input label="Field" error="Error message" id="field-input" />);
      const input = screen.getByLabelText('Field');
      expect(input).toHaveAttribute('aria-describedby', 'field-input-error');
    });

    it('should link helper text with aria-describedby', () => {
      render(<Input label="Field" helperText="Helper text" id="field-input" />);
      const input = screen.getByLabelText('Field');
      expect(input).toHaveAttribute('aria-describedby', 'field-input-helper');
    });
  });
});
