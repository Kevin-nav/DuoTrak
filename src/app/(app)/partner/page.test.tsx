import { render, screen, waitFor } from '@testing-library/react';
import Page from './page';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

// Mock the API endpoint for fetching message history
const server = setupServer(
  http.get('http://localhost:8000/api/v1/chat/history/:conversation_id', () => {
    return HttpResponse.json([]); // Return empty array for now
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('Partner Page', () => {
  it('should display message history', async () => {
    render(<Page />);

    // This test will initially fail because the component doesn't fetch/display history yet
    await waitFor(() => {
      expect(screen.getByText('No messages yet.')).toBeInTheDocument();
    });
  });
});
