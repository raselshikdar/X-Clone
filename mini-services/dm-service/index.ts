import { createServer } from 'http'
import { Server, Socket } from 'socket.io'

const httpServer = createServer()
const io = new Server(httpServer, {
  path: '/',
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
  pingTimeout: 60000,
  pingInterval: 25000,
})

// Types
interface User {
  id: string
  username: string
  socketId: string
}

interface Message {
  id: string
  conversationId: string
  senderId: string
  recipientId: string
  content: string
  mediaUrl?: string
  createdAt: Date
}

interface TypingData {
  senderId: string
  recipientId: string
  conversationId: string
  isTyping: boolean
}

// Store active users: userId -> User
const activeUsers = new Map<string, User>()

// Store socket to userId mapping: socketId -> userId
const socketToUser = new Map<string, string>()

// Helper to get user's room name
const getUserRoom = (userId: string) => `user:${userId}`

// Helper to get conversation room name
const getConversationRoom = (conversationId: string) => `conversation:${conversationId}`

io.on('connection', (socket: Socket) => {
  console.log(`[DM Service] User connected: ${socket.id}`)

  // User joins their personal room
  socket.on('join', (data: { userId: string; username: string }) => {
    const { userId, username } = data

    // Store user info
    const user: User = {
      id: userId,
      username,
      socketId: socket.id
    }

    activeUsers.set(userId, user)
    socketToUser.set(socket.id, userId)

    // Join personal room
    socket.join(getUserRoom(userId))

    // Notify others that user is online
    socket.broadcast.emit('user-online', { userId })

    // Send active users list to the user
    socket.emit('active-users', {
      users: Array.from(activeUsers.values())
    })

    console.log(`[DM Service] ${username} (${userId}) joined their room`)
  })

  // Send message
  socket.on('message', (data: {
    message: Message
    recipientId: string
  }) => {
    const { message, recipientId } = data
    const senderId = socketToUser.get(socket.id)

    if (!senderId) {
      console.error('[DM Service] Message from unauthenticated user')
      return
    }

    // Emit to recipient's room
    io.to(getUserRoom(recipientId)).emit('message', {
      message,
      senderId
    })

    // Also emit to sender for confirmation (if they have other tabs open)
    io.to(getUserRoom(senderId)).emit('message-sent', {
      message
    })

    console.log(`[DM Service] Message sent from ${senderId} to ${recipientId}`)
  })

  // Typing indicator
  socket.on('typing', (data: TypingData) => {
    const { senderId, recipientId, conversationId, isTyping } = data
    const userId = socketToUser.get(socket.id)

    if (userId !== senderId) {
      return
    }

    // Emit to recipient's room
    io.to(getUserRoom(recipientId)).emit('typing', {
      senderId,
      conversationId,
      isTyping
    })
  })

  // Messages read
  socket.on('read', (data: {
    conversationId: string
    messageIds: string[]
    readerId: string
    senderId: string
  }) => {
    const { conversationId, messageIds, readerId, senderId } = data
    const userId = socketToUser.get(socket.id)

    if (userId !== readerId) {
      return
    }

    // Notify the original sender that their messages were read
    io.to(getUserRoom(senderId)).emit('read', {
      conversationId,
      messageIds,
      readBy: readerId,
      readAt: new Date()
    })

    console.log(`[DM Service] Messages read by ${readerId} in conversation ${conversationId}`)
  })

  // Online status check
  socket.on('check-online', (data: { userIds: string[] }) => {
    const { userIds } = data
    const onlineStatus: Record<string, boolean> = {}

    userIds.forEach(userId => {
      onlineStatus[userId] = activeUsers.has(userId)
    })

    socket.emit('online-status', { status: onlineStatus })
  })

  // Handle disconnection
  socket.on('disconnect', () => {
    const userId = socketToUser.get(socket.id)

    if (userId) {
      const user = activeUsers.get(userId)
      activeUsers.delete(userId)
      socketToUser.delete(socket.id)

      // Notify others that user is offline
      io.emit('user-offline', { userId })

      console.log(`[DM Service] ${user?.username || userId} disconnected`)
    } else {
      console.log(`[DM Service] Unknown user disconnected: ${socket.id}`)
    }
  })

  // Handle errors
  socket.on('error', (error: Error) => {
    console.error(`[DM Service] Socket error (${socket.id}):`, error)
  })
})

const PORT = 3002
httpServer.listen(PORT, () => {
  console.log(`[DM Service] WebSocket server running on port ${PORT}`)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[DM Service] Received SIGTERM signal, shutting down server...')
  httpServer.close(() => {
    console.log('[DM Service] WebSocket server closed')
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  console.log('[DM Service] Received SIGINT signal, shutting down server...')
  httpServer.close(() => {
    console.log('[DM Service] WebSocket server closed')
    process.exit(0)
  })
})

export { io, activeUsers }
