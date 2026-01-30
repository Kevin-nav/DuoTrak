# Quickstart: Real-time Chat Interface

This guide provides the steps to test and verify the real-time chat feature.

## Prerequisites
- Two user accounts have been created and are accountability partners.
- Both users are logged into the application.

## Testing Scenarios

### 1. Send and Receive a Text Message
1.  **User A**: Navigate to the "Partner" page.
2.  **User A**: In the chat input box, type "Hello!" and press Enter.
3.  **Verification**:
    - The message "Hello!" appears in User A's chat window.
    - The message "Hello!" appears in User B's chat window in real-time.

### 2. See Typing Indicator
1.  **User B**: Navigate to the "Partner" page.
2.  **User B**: Click in the chat input box and start typing.
3.  **Verification**:
    - User A sees a "typing..." indicator in their chat window.

### 3. React to a Message
1.  **User A**: Hover over the message "Hello!" sent by User A.
2.  **User A**: Click the "react" button and select the "👍" emoji.
3.  **Verification**:
    - The "👍" emoji appears on the message in both User A's and User B's chat windows.

### 4. Send an Image
1.  **User B**: Click the "attach" button in the chat input area.
2.  **User B**: Select an image file (e.g., `progress.png`, less than 10MB).
3.  **User B**: Click "Send".
4.  **Verification**:
    - A thumbnail of the image appears in the chat window for both users.
    - Clicking the thumbnail opens the full-size image.

### 5. Send a Voice Note
1.  **User A**: Click and hold the "record voice note" button.
2.  **User A**: Speak a short message and release the button.
3.  **Verification**:
    - A voice note player appears in the chat window for both users.
    - Both users can click the play button to listen to the voice note.
