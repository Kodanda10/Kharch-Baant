import { describe, it, expect, vi, beforeEach } from 'vitest'
import { addPersonToGroup } from '../../services/apiService'
import * as supabaseApi from '../../services/supabaseApiService'
import { supabase } from '../../lib/supabase'

// Mock the supabaseApi module
vi.mock('../../services/supabaseApiService', () => ({
  addPerson: vi.fn()
}))

// Mock the supabase client
const mockSupabase = {
  from: vi.fn(() => ({
    insert: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn()
  }))
}

vi.mock('../../lib/supabase', () => ({
  supabase: mockSupabase
}))

describe('addPersonToGroup', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should add person to group with custom avatar URL', async () => {
    const groupId = 'g1'
    const personData = {
      name: 'John Doe',
      avatarUrl: 'https://custom-avatar.com/john.jpg'
    }
    
    const mockPerson = {
      id: 'p1',
      name: 'John Doe',
      avatarUrl: 'https://custom-avatar.com/john.jpg'
    }
    
    vi.mocked(supabaseApi.addPerson).mockResolvedValue(mockPerson)
    mockSupabase.from().insert.mockResolvedValue({ error: null })
    
    const result = await addPersonToGroup(groupId, personData)
    
    expect(supabaseApi.addPerson).toHaveBeenCalledWith({
      name: 'John Doe',
      avatarUrl: 'https://custom-avatar.com/john.jpg'
    })
    
    expect(mockSupabase.from).toHaveBeenCalledWith('group_members')
    expect(mockSupabase.from().insert).toHaveBeenCalledWith({
      group_id: groupId,
      person_id: 'p1'
    })
    
    expect(result).toEqual(mockPerson)
  })

  it('should add person to group with generated avatar URL', async () => {
    const groupId = 'g1'
    const personData = {
      name: 'Jane Smith'
    }
    
    const mockPerson = {
      id: 'p2',
      name: 'Jane Smith',
      avatarUrl: 'https://i.pravatar.cc/150?u=Jane%20Smith'
    }
    
    vi.mocked(supabaseApi.addPerson).mockResolvedValue(mockPerson)
    mockSupabase.from().insert.mockResolvedValue({ error: null })
    
    const result = await addPersonToGroup(groupId, personData)
    
    expect(supabaseApi.addPerson).toHaveBeenCalledWith({
      name: 'Jane Smith',
      avatarUrl: 'https://i.pravatar.cc/150?u=Jane%20Smith'
    })
    
    expect(mockSupabase.from).toHaveBeenCalledWith('group_members')
    expect(mockSupabase.from().insert).toHaveBeenCalledWith({
      group_id: groupId,
      person_id: 'p2'
    })
    
    expect(result).toEqual(mockPerson)
  })

  it('should handle special characters in name for avatar URL generation', async () => {
    const groupId = 'g1'
    const personData = {
      name: 'José María'
    }
    
    const mockPerson = {
      id: 'p3',
      name: 'José María',
      avatarUrl: 'https://i.pravatar.cc/150?u=Jos%C3%A9%20Mar%C3%ADa'
    }
    
    vi.mocked(supabaseApi.addPerson).mockResolvedValue(mockPerson)
    mockSupabase.from().insert.mockResolvedValue({ error: null })
    
    const result = await addPersonToGroup(groupId, personData)
    
    expect(supabaseApi.addPerson).toHaveBeenCalledWith({
      name: 'José María',
      avatarUrl: 'https://i.pravatar.cc/150?u=Jos%C3%A9%20Mar%C3%ADa'
    })
    
    expect(result).toEqual(mockPerson)
  })

  it('should throw error if person creation fails', async () => {
    const groupId = 'g1'
    const personData = {
      name: 'John Doe'
    }
    
    const error = new Error('Failed to create person')
    vi.mocked(supabaseApi.addPerson).mockRejectedValue(error)
    
    await expect(addPersonToGroup(groupId, personData)).rejects.toThrow('Failed to create person')
    
    expect(supabaseApi.addPerson).toHaveBeenCalledWith({
      name: 'John Doe',
      avatarUrl: 'https://i.pravatar.cc/150?u=John%20Doe'
    })
    
    // Should not attempt to insert group membership if person creation fails
    expect(mockSupabase.from).not.toHaveBeenCalled()
  })

  it('should throw error if group membership insertion fails', async () => {
    const groupId = 'g1'
    const personData = {
      name: 'John Doe'
    }
    
    const mockPerson = {
      id: 'p1',
      name: 'John Doe',
      avatarUrl: 'https://i.pravatar.cc/150?u=John%20Doe'
    }
    
    const error = new Error('Failed to add person to group')
    vi.mocked(supabaseApi.addPerson).mockResolvedValue(mockPerson)
    mockSupabase.from().insert.mockResolvedValue({ error })
    
    await expect(addPersonToGroup(groupId, personData)).rejects.toThrow('Failed to add person to group')
    
    expect(supabaseApi.addPerson).toHaveBeenCalledWith({
      name: 'John Doe',
      avatarUrl: 'https://i.pravatar.cc/150?u=John%20Doe'
    })
    
    expect(mockSupabase.from).toHaveBeenCalledWith('group_members')
    expect(mockSupabase.from().insert).toHaveBeenCalledWith({
      group_id: groupId,
      person_id: 'p1'
    })
  })

  it('should handle empty name', async () => {
    const groupId = 'g1'
    const personData = {
      name: ''
    }
    
    const mockPerson = {
      id: 'p1',
      name: '',
      avatarUrl: 'https://i.pravatar.cc/150?u='
    }
    
    vi.mocked(supabaseApi.addPerson).mockResolvedValue(mockPerson)
    mockSupabase.from().insert.mockResolvedValue({ error: null })
    
    const result = await addPersonToGroup(groupId, personData)
    
    expect(supabaseApi.addPerson).toHaveBeenCalledWith({
      name: '',
      avatarUrl: 'https://i.pravatar.cc/150?u='
    })
    
    expect(result).toEqual(mockPerson)
  })
})
