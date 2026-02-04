export interface ImagePayload {
  source: 'camera' | 'screen' | 'upload';
  data: string;
  mime_type: string;
}
