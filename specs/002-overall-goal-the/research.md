# Research: Real-time Chat Interface

## File Size and Type Limits

**Decision**:
- **File Size Limit**: 10MB per file.
- **File Types**:
  - **Images**: `image/jpeg`, `image/png`, `image/gif`
  - **Documents**: `application/pdf`, `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document` (docx)
  - **Audio**: `audio/mpeg`, `audio/wav`

**Rationale**:
- The 10MB limit is a balance between allowing users to share high-quality images and documents without incurring excessive storage and bandwidth costs.
- The allowed file types are common and relevant to the productivity context of the application. This is not a general file-sharing platform.
- These limits can be adjusted in the future based on user feedback and system performance.

**Alternatives considered**:
- **Larger file size limits (e.g., 25MB, 50MB)**: Rejected to control costs and keep the platform focused on productivity-related sharing, not large file transfers.
- **Wider range of file types**: Rejected to reduce the complexity of file handling and security concerns associated with executable or less common file formats.
