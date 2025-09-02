import { exec } from 'child_process';
import { promisify } from 'util';
import { storage } from '../storage';
import type { InsertMusicQueue } from '@shared/schema';

const execAsync = promisify(exec);

export class MusicService {
  async searchAndQueue(query: string, groupId: string, requestedBy: string): Promise<any> {
    try {
      // Use yt-dlp to search for the song
      const searchCommand = `yt-dlp "ytsearch:${query}" --get-title --get-url --no-playlist --max-downloads 1`;
      const { stdout } = await execAsync(searchCommand);
      
      const lines = stdout.trim().split('\n');
      if (lines.length < 2) return null;

      const title = lines[0];
      const url = lines[1];

      // Get current queue position
      const currentQueue = await storage.getMusicQueue(groupId);
      const position = currentQueue.length + 1;

      // Add to queue
      const queueItem: InsertMusicQueue = {
        groupId,
        title,
        url,
        requestedBy,
        position,
        status: position === 1 ? 'playing' : 'queued',
      };

      const result = await storage.addToMusicQueue(queueItem);
      
      return {
        title,
        url,
        artist: this.extractArtist(title),
      };
    } catch (error) {
      console.error('Music search error:', error);
      return null;
    }
  }

  private extractArtist(title: string): string | undefined {
    // Simple artist extraction from title
    const patterns = [
      / - (.+)$/,  // "Song - Artist"
      /^(.+?) - /,  // "Artist - Song"
      /\bby\s+(.+)$/i,  // "Song by Artist"
    ];

    for (const pattern of patterns) {
      const match = title.match(pattern);
      if (match) return match[1].trim();
    }

    return undefined;
  }

  async getQueue(groupId: string) {
    return await storage.getMusicQueue(groupId);
  }

  async skipCurrent(groupId: string) {
    const queue = await storage.getMusicQueue(groupId);
    const currentSong = queue.find(item => item.status === 'playing');
    
    if (currentSong) {
      await storage.updateMusicQueueItem(currentSong.id, { status: 'skipped' });
      
      // Start next song if available
      const nextSong = queue.find(item => item.status === 'queued');
      if (nextSong) {
        await storage.updateMusicQueueItem(nextSong.id, { status: 'playing' });
      }
    }
  }

  async clearQueue(groupId: string) {
    return await storage.clearMusicQueue(groupId);
  }
}
