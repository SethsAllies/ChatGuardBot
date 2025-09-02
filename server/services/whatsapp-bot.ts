import makeWASocket, { 
  DisconnectReason, 
  useMultiFileAuthState, 
  WASocket,
  GroupMetadata,
  isJidGroup,
  proto
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import qrcode from 'qrcode';
import { storage } from '../storage';
import { MusicService } from './music-service.js';

export class WhatsAppBot {
  private sock: WASocket | null = null;
  private musicService: MusicService;
  private qrCode: string | null = null;
  private linkCode: string | null = null;
  private phoneNumber: string | null = null;
  private connectionStatus: string = 'disconnected';

  constructor() {
    this.musicService = new MusicService();
  }

  async requestLinkCode(phoneNumber: string) {
    try {
      this.phoneNumber = phoneNumber;
      const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
      
      this.sock = makeWASocket({
        auth: state,
        mobile: true,
        browser: ['WhatsApp Bot', 'Chrome', '1.0.0']
      });

      this.sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;
        
        if (connection === 'close') {
          const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
          
          if (shouldReconnect) {
            await this.logActivity('warning', 'whatsapp', 'Connection closed, attempting to reconnect...');
            setTimeout(() => this.requestLinkCode(phoneNumber), 3000);
          } else {
            await this.updateSessionStatus('disconnected');
            await this.logActivity('error', 'whatsapp', 'WhatsApp connection logged out');
          }
        } else if (connection === 'open') {
          this.connectionStatus = 'connected';
          await this.updateSessionStatus('connected');
          await this.logActivity('info', 'whatsapp', 'WhatsApp connection established');
          await this.updateGroupsList();
        }
      });

      this.sock.ev.on('creds.update', saveCreds);
      this.sock.ev.on('messages.upsert', this.handleMessage.bind(this));
      this.sock.ev.on('group-participants.update', this.handleGroupUpdate.bind(this));

      // Request pairing code
      const code = await this.sock.requestPairingCode(phoneNumber);
      this.linkCode = code;
      await this.updateSessionStatus('waiting-for-code');
      await this.logActivity('info', 'system', `Link code generated: ${code}`);
      
    } catch (error) {
      await this.logActivity('error', 'system', `Failed to request link code: ${error}`);
      throw error;
    }
  }

  async verifyLinkCode(code: string): Promise<boolean> {
    try {
      if (this.linkCode === code) {
        // The connection should automatically proceed once the correct code is provided
        return true;
      }
      return false;
    } catch (error) {
      await this.logActivity('error', 'system', `Failed to verify link code: ${error}`);
      return false;
    }
  }

  async startBot() {
    try {
      const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
      
      this.sock = makeWASocket({
        auth: state,
        browser: ['WhatsApp Bot', 'Chrome', '1.0.0']
      });

      this.sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        if (qr) {
          this.qrCode = await qrcode.toDataURL(qr);
          await this.updateSessionStatus('connecting');
          await this.logActivity('info', 'system', 'QR code generated for WhatsApp connection');
        }

        if (connection === 'close') {
          const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
          
          if (shouldReconnect) {
            await this.logActivity('warning', 'whatsapp', 'Connection closed, attempting to reconnect...');
            setTimeout(() => this.startBot(), 3000);
          } else {
            await this.updateSessionStatus('disconnected');
            await this.logActivity('error', 'whatsapp', 'WhatsApp connection logged out');
          }
        } else if (connection === 'open') {
          this.connectionStatus = 'connected';
          await this.updateSessionStatus('connected');
          await this.logActivity('info', 'whatsapp', 'WhatsApp connection established');
          await this.updateGroupsList();
        }
      });

      this.sock.ev.on('creds.update', saveCreds);
      this.sock.ev.on('messages.upsert', this.handleMessage.bind(this));
      this.sock.ev.on('group-participants.update', this.handleGroupUpdate.bind(this));

    } catch (error) {
      await this.logActivity('error', 'system', `Failed to start bot: ${error}`);
      throw error;
    }
  }

  private async handleMessage(m: any) {
    const message = m.messages[0];
    if (!message.message || message.key.fromMe) return;

    const messageText = message.message.conversation || 
                      message.message.extendedTextMessage?.text || '';
    
    if (!messageText.startsWith('/')) return;

    const [command, ...args] = messageText.split(' ');
    const groupId = message.key.remoteJid;
    const sender = message.key.participant || message.key.remoteJid;

    await this.logActivity('info', 'commands', `Command executed: ${command} by ${sender}`);
    await this.handleCommand(command, args, groupId, sender, message);
  }

  private async handleCommand(command: string, args: string[], groupId: string, sender: string, message: any) {
    if (!this.sock) return;

    try {
      switch (command) {
        case '/help':
          await this.sendHelp(groupId);
          break;
        case '/ping':
          await this.sock.sendMessage(groupId, { text: '🏓 Pong!' });
          break;
        case '/kick':
          await this.handleKick(groupId, args, sender);
          break;
        case '/mute':
          await this.handleMute(groupId, args, sender);
          break;
        case '/promote':
          await this.handlePromote(groupId, args, sender);
          break;
        case '/demote':
          await this.handleDemote(groupId, args, sender);
          break;
        case '/play':
          await this.handlePlay(groupId, args.join(' '), sender);
          break;
        case '/queue':
          await this.handleQueue(groupId);
          break;
        case '/skip':
          await this.handleSkip(groupId, sender);
          break;
        case '/userinfo':
          await this.handleUserInfo(groupId, args, sender);
          break;
        default:
          await this.sock.sendMessage(groupId, { text: '❌ Unknown command. Type /help for available commands.' });
      }

      // Update command stats
      const stats = await storage.getStats();
      if (stats) {
        await storage.updateStats({ commandsToday: (stats.commandsToday || 0) + 1 });
      }

    } catch (error) {
      await this.logActivity('error', 'commands', `Command error: ${error}`);
      await this.sock.sendMessage(groupId, { text: '❌ An error occurred while processing the command.' });
    }
  }

  private async sendHelp(groupId: string) {
    if (!this.sock) return;

    const commands = await storage.getCommands();
    const enabledCommands = commands.filter(cmd => cmd.enabled);
    
    let helpText = '📋 *Available Commands:*\n\n';
    
    const categories = ['moderation', 'music', 'utility'];
    
    for (const category of categories) {
      const categoryCommands = enabledCommands.filter(cmd => cmd.category === category);
      if (categoryCommands.length > 0) {
        helpText += `*${category.toUpperCase()}:*\n`;
        categoryCommands.forEach(cmd => {
          helpText += `${cmd.name} - ${cmd.description}\n`;
          if (cmd.usage) helpText += `   Usage: ${cmd.usage}\n`;
        });
        helpText += '\n';
      }
    }

    await this.sock.sendMessage(groupId, { text: helpText });
  }

  private async handleKick(groupId: string, args: string[], sender: string) {
    if (!this.sock || !isJidGroup(groupId)) return;

    const group = await storage.getGroup(groupId);
    if (!group?.isAdmin) {
      await this.sock.sendMessage(groupId, { text: '❌ Bot is not an admin in this group.' });
      return;
    }

    if (args.length === 0) {
      await this.sock.sendMessage(groupId, { text: '❌ Please mention a user to kick. Usage: /kick @user' });
      return;
    }

    // Extract mentioned users
    const mentionedJid = args[0].replace('@', '') + '@s.whatsapp.net';
    
    try {
      await this.sock.groupParticipantsUpdate(groupId, [mentionedJid], 'remove');
      await this.sock.sendMessage(groupId, { text: `✅ User has been removed from the group.` });
      await this.logActivity('info', 'commands', `User ${mentionedJid} kicked from group ${groupId} by ${sender}`);
    } catch (error) {
      await this.sock.sendMessage(groupId, { text: '❌ Failed to kick user. Make sure the user exists and bot has admin rights.' });
    }
  }

  private async handleMute(groupId: string, args: string[], sender: string) {
    if (!this.sock || !isJidGroup(groupId)) return;

    const group = await storage.getGroup(groupId);
    if (!group?.isAdmin) {
      await this.sock.sendMessage(groupId, { text: '❌ Bot is not an admin in this group.' });
      return;
    }

    // For simplicity, toggle group settings (in real implementation, you'd track individual user mutes)
    try {
      await this.sock.groupSettingUpdate(groupId, 'announcement');
      await this.sock.sendMessage(groupId, { text: '🔇 Group has been muted. Only admins can send messages.' });
      await this.logActivity('info', 'commands', `Group ${groupId} muted by ${sender}`);
    } catch (error) {
      await this.sock.sendMessage(groupId, { text: '❌ Failed to mute group.' });
    }
  }

  private async handlePromote(groupId: string, args: string[], sender: string) {
    if (!this.sock || !isJidGroup(groupId)) return;

    const group = await storage.getGroup(groupId);
    if (!group?.isAdmin) {
      await this.sock.sendMessage(groupId, { text: '❌ Bot is not an admin in this group.' });
      return;
    }

    if (args.length === 0) {
      await this.sock.sendMessage(groupId, { text: '❌ Please mention a user to promote. Usage: /promote @user' });
      return;
    }

    const mentionedJid = args[0].replace('@', '') + '@s.whatsapp.net';
    
    try {
      await this.sock.groupParticipantsUpdate(groupId, [mentionedJid], 'promote');
      await this.sock.sendMessage(groupId, { text: `✅ User has been promoted to admin.` });
      await this.logActivity('info', 'commands', `User ${mentionedJid} promoted in group ${groupId} by ${sender}`);
    } catch (error) {
      await this.sock.sendMessage(groupId, { text: '❌ Failed to promote user.' });
    }
  }

  private async handleDemote(groupId: string, args: string[], sender: string) {
    if (!this.sock || !isJidGroup(groupId)) return;

    const group = await storage.getGroup(groupId);
    if (!group?.isAdmin) {
      await this.sock.sendMessage(groupId, { text: '❌ Bot is not an admin in this group.' });
      return;
    }

    if (args.length === 0) {
      await this.sock.sendMessage(groupId, { text: '❌ Please mention a user to demote. Usage: /demote @user' });
      return;
    }

    const mentionedJid = args[0].replace('@', '') + '@s.whatsapp.net';
    
    try {
      await this.sock.groupParticipantsUpdate(groupId, [mentionedJid], 'demote');
      await this.sock.sendMessage(groupId, { text: `✅ User has been demoted from admin.` });
      await this.logActivity('info', 'commands', `User ${mentionedJid} demoted in group ${groupId} by ${sender}`);
    } catch (error) {
      await this.sock.sendMessage(groupId, { text: '❌ Failed to demote user.' });
    }
  }

  private async handlePlay(groupId: string, query: string, sender: string) {
    if (!this.sock) return;

    if (!query) {
      await this.sock.sendMessage(groupId, { text: '❌ Please provide a song name. Usage: /play [song name]' });
      return;
    }

    try {
      await this.sock.sendMessage(groupId, { text: '🎵 Searching for song...' });
      
      const result = await this.musicService.searchAndQueue(query, groupId, sender);
      
      if (result) {
        await this.sock.sendMessage(groupId, { 
          text: `🎵 Added to queue: ${result.title}${result.artist ? ` by ${result.artist}` : ''}` 
        });
        
        // Update music stats
        const stats = await storage.getStats();
        if (stats) {
          await storage.updateStats({ musicRequests: (stats.musicRequests || 0) + 1 });
        }
        
        await this.logActivity('info', 'music', `Song queued: ${result.title} in group ${groupId}`);
      } else {
        await this.sock.sendMessage(groupId, { text: '❌ Could not find the requested song.' });
      }
    } catch (error) {
      await this.sock.sendMessage(groupId, { text: '❌ Error playing music. Please try again.' });
      await this.logActivity('error', 'music', `Music play error: ${error}`);
    }
  }

  private async handleQueue(groupId: string) {
    if (!this.sock) return;

    const queue = await storage.getMusicQueue(groupId);
    
    if (queue.length === 0) {
      await this.sock.sendMessage(groupId, { text: '🎵 Music queue is empty.' });
      return;
    }

    let queueText = '🎵 *Current Music Queue:*\n\n';
    queue.slice(0, 10).forEach((item, index) => {
      const status = item.status === 'playing' ? '▶️' : 
                    item.status === 'completed' ? '✅' : '⏸️';
      queueText += `${index + 1}. ${status} ${item.title}${item.artist ? ` by ${item.artist}` : ''}\n`;
    });

    if (queue.length > 10) {
      queueText += `\n... and ${queue.length - 10} more songs`;
    }

    await this.sock.sendMessage(groupId, { text: queueText });
  }

  private async handleSkip(groupId: string, sender: string) {
    if (!this.sock) return;

    const queue = await storage.getMusicQueue(groupId);
    const currentSong = queue.find(item => item.status === 'playing');

    if (!currentSong) {
      await this.sock.sendMessage(groupId, { text: '❌ No song is currently playing.' });
      return;
    }

    await storage.updateMusicQueueItem(currentSong.id, { status: 'skipped' });
    await this.sock.sendMessage(groupId, { text: '⏭️ Song skipped!' });
    await this.logActivity('info', 'music', `Song skipped by ${sender} in group ${groupId}`);
  }

  private async handleUserInfo(groupId: string, args: string[], sender: string) {
    if (!this.sock) return;

    const targetUser = args.length > 0 ? args[0].replace('@', '') + '@s.whatsapp.net' : sender;
    
    try {
      const userInfo = `👤 *User Information:*\n\nPhone: ${targetUser}\nJoined: Recently\nStatus: Active`;
      await this.sock.sendMessage(groupId, { text: userInfo });
    } catch (error) {
      await this.sock.sendMessage(groupId, { text: '❌ Could not retrieve user information.' });
    }
  }

  private async handleGroupUpdate(update: any) {
    const { id, participants, action } = update;
    
    if (action === 'add') {
      const group = await storage.getGroup(id);
      if (group?.welcomeMessage) {
        await this.sock?.sendMessage(id, { text: group.welcomeMessage });
      }
      await this.logActivity('info', 'whatsapp', `New member joined group: ${id}`);
    } else if (action === 'remove') {
      const group = await storage.getGroup(id);
      if (group?.farewellMessage) {
        await this.sock?.sendMessage(id, { text: group.farewellMessage });
      }
      await this.logActivity('info', 'whatsapp', `Member left group: ${id}`);
    }
  }

  private async updateGroupsList() {
    if (!this.sock) return;

    try {
      const groups = await this.sock.groupFetchAllParticipating();
      let activeGroupCount = 0;

      for (const [groupId, groupInfo] of Object.entries(groups)) {
        const metadata = groupInfo as GroupMetadata;
        const isAdmin = metadata.participants.some(p => 
          p.id === this.sock?.user?.id && (p.admin === 'admin' || p.admin === 'superadmin')
        );

        await storage.createGroup({
          id: groupId,
          name: metadata.subject,
          memberCount: metadata.participants.length,
          isAdmin,
          moderationEnabled: true,
          antiSpam: true,
          antiLink: false,
        });

        activeGroupCount++;
      }

      const stats = await storage.getStats();
      if (stats) {
        await storage.updateStats({ activeGroups: activeGroupCount });
      }

      await this.logActivity('info', 'system', `Updated ${activeGroupCount} groups`);
    } catch (error) {
      await this.logActivity('error', 'system', `Failed to update groups list: ${error}`);
    }
  }

  private async updateSessionStatus(status: string) {
    const session = await storage.getBotSession();
    
    if (session) {
      await storage.updateBotSession(session.id, { 
        status,
        phoneNumber: this.phoneNumber,
        qrCode: this.qrCode,
        connectedAt: status === 'connected' ? new Date() : session.connectedAt
      });
    } else {
      await storage.createBotSession({
        status,
        phoneNumber: this.phoneNumber,
        qrCode: this.qrCode,
        connectedAt: status === 'connected' ? new Date() : undefined,
      });
    }
  }

  private async logActivity(level: string, source: string, message: string, metadata?: any) {
    await storage.createLog({
      level,
      source,
      message,
      metadata: metadata ? JSON.stringify(metadata) : null,
    });
  }

  async disconnect() {
    if (this.sock) {
      await this.sock.logout();
      this.sock = null;
      this.connectionStatus = 'disconnected';
      await this.updateSessionStatus('disconnected');
      await this.logActivity('info', 'system', 'Bot disconnected manually');
    }
  }

  getConnectionStatus() {
    return this.connectionStatus;
  }

  getQRCode() {
    return this.qrCode;
  }

  getLinkCode() {
    return this.linkCode;
  }

  getPhoneNumber() {
    return this.phoneNumber;
  }

  async broadcastMessage(message: string, groupIds?: string[]) {
    if (!this.sock) return false;

    try {
      const groups = await storage.getGroups();
      const targetGroups = groupIds || groups.map(g => g.id);

      for (const groupId of targetGroups) {
        await this.sock.sendMessage(groupId, { text: message });
      }

      await this.logActivity('info', 'system', `Broadcast message sent to ${targetGroups.length} groups`);
      return true;
    } catch (error) {
      await this.logActivity('error', 'system', `Broadcast failed: ${error}`);
      return false;
    }
  }
}

export const whatsappBot = new WhatsAppBot();
