import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import GroupList from '../../components/GroupList'
import { Group, Person } from '../../types'

// Mock the Avatar component
vi.mock('../../components/Avatar', () => ({
  default: ({ person, size }: { person: Person; size: string }) => (
    <div data-testid={`avatar-${person.id}`} data-size={size}>
      {person.name}
    </div>
  )
}))

// Mock the icons
vi.mock('../../components/icons/Icons', () => ({
  PlusIcon: () => <div data-testid="plus-icon">+</div>,
  HomeIcon: () => <div data-testid="home-icon">🏠</div>
}))

describe('GroupList', () => {
  const mockPeople: Person[] = [
    {
      id: 'p1',
      name: 'John Doe',
      avatarUrl: 'https://example.com/avatar1.jpg'
    },
    {
      id: 'p2',
      name: 'Jane Smith',
      avatarUrl: 'https://example.com/avatar2.jpg'
    },
    {
      id: 'p3',
      name: 'Bob Johnson',
      avatarUrl: 'https://example.com/avatar3.jpg'
    },
    {
      id: 'p4',
      name: 'Alice Brown',
      avatarUrl: 'https://example.com/avatar4.jpg'
    },
    {
      id: 'p5',
      name: 'Charlie Wilson',
      avatarUrl: 'https://example.com/avatar5.jpg'
    }
  ]

  const mockGroups: Group[] = [
    {
      id: 'g1',
      name: 'Household Group',
      currency: 'USD',
      members: ['p1', 'p2'],
      groupType: 'household'
    },
    {
      id: 'g2',
      name: 'Trip Group',
      currency: 'EUR',
      members: ['p1', 'p3', 'p4', 'p5'],
      groupType: 'trip',
      tripStartDate: '2024-01-01',
      tripEndDate: '2024-01-07'
    },
    {
      id: 'g3',
      name: 'Other Group',
      currency: 'GBP',
      members: ['p2', 'p3'],
      groupType: 'other'
    }
  ]

  const defaultProps = {
    groups: mockGroups,
    people: mockPeople,
    selectedGroupId: null,
    onSelectGroup: vi.fn(),
    onAddGroup: vi.fn(),
    onGoHome: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render group list with all groups', () => {
    render(<GroupList {...defaultProps} />)
    
    expect(screen.getByText('Household Group')).toBeInTheDocument()
    expect(screen.getByText('Trip Group')).toBeInTheDocument()
    expect(screen.getByText('Other Group')).toBeInTheDocument()
  })

  it('should render add group button', () => {
    render(<GroupList {...defaultProps} />)
    
    const addButton = screen.getByRole('button', { name: /add group/i })
    expect(addButton).toBeInTheDocument()
    expect(screen.getByTestId('plus-icon')).toBeInTheDocument()
  })

  it('should call onAddGroup when add group button is clicked', () => {
    render(<GroupList {...defaultProps} />)
    
    const addButton = screen.getByRole('button', { name: /add group/i })
    fireEvent.click(addButton)
    
    expect(defaultProps.onAddGroup).toHaveBeenCalledOnce()
  })

  it('should render go home button', () => {
    render(<GroupList {...defaultProps} />)
    
    const homeButton = screen.getByRole('button', { name: /go home/i })
    expect(homeButton).toBeInTheDocument()
    expect(screen.getByTestId('home-icon')).toBeInTheDocument()
  })

  it('should call onGoHome when go home button is clicked', () => {
    render(<GroupList {...defaultProps} />)
    
    const homeButton = screen.getByRole('button', { name: /go home/i })
    fireEvent.click(homeButton)
    
    expect(defaultProps.onGoHome).toHaveBeenCalledOnce()
  })

  it('should highlight selected group', () => {
    render(<GroupList {...defaultProps} selectedGroupId="g1" />)
    
    const selectedGroup = screen.getByText('Household Group').closest('button')
    expect(selectedGroup).toHaveClass('bg-white/10')
  })

  it('should not highlight unselected groups', () => {
    render(<GroupList {...defaultProps} selectedGroupId="g1" />)
    
    const unselectedGroup = screen.getByText('Trip Group').closest('button')
    expect(unselectedGroup).not.toHaveClass('bg-white/10')
    expect(unselectedGroup).toHaveClass('hover:bg-white/5')
  })

  it('should call onSelectGroup when group is clicked', () => {
    render(<GroupList {...defaultProps} />)
    
    const groupButton = screen.getByText('Household Group').closest('button')
    fireEvent.click(groupButton!)
    
    expect(defaultProps.onSelectGroup).toHaveBeenCalledWith('g1')
  })

  it('should render group type labels', () => {
    render(<GroupList {...defaultProps} />)
    
    // Should show group type labels
    expect(screen.getByText('Household')).toBeInTheDocument()
    expect(screen.getByText('Trip')).toBeInTheDocument()
    expect(screen.getByText('Other')).toBeInTheDocument()
  })

  it('should render trip date range for trip groups', () => {
    render(<GroupList {...defaultProps} />)
    
    // Should show trip date range for trip group
    expect(screen.getByText('Jan 1 - Jan 7')).toBeInTheDocument()
  })

  it('should not render trip date range for non-trip groups', () => {
    render(<GroupList {...defaultProps} />)
    
    // Household and Other groups should not have trip date ranges
    const householdGroup = screen.getByText('Household Group').closest('button')
    const otherGroup = screen.getByText('Other Group').closest('button')
    
    expect(householdGroup).not.toHaveTextContent('Jan 1 - Jan 7')
    expect(otherGroup).not.toHaveTextContent('Jan 1 - Jan 7')
  })

  it('should render member avatars', () => {
    render(<GroupList {...defaultProps} />)
    
    // Should render avatars for group members
    expect(screen.getByTestId('avatar-p1')).toBeInTheDocument()
    expect(screen.getByTestId('avatar-p2')).toBeInTheDocument()
    expect(screen.getByTestId('avatar-p3')).toBeInTheDocument()
  })

  it('should limit displayed avatars to 4 and show count for more', () => {
    render(<GroupList {...defaultProps} />)
    
    // Trip group has 4 members, so all should be shown
    expect(screen.getByTestId('avatar-p1')).toBeInTheDocument()
    expect(screen.getByTestId('avatar-p3')).toBeInTheDocument()
    expect(screen.getByTestId('avatar-p4')).toBeInTheDocument()
    expect(screen.getByTestId('avatar-p5')).toBeInTheDocument()
    
    // Should not show +1 count since exactly 4 members
    expect(screen.queryByText('+1')).not.toBeInTheDocument()
  })

  it('should show member count for groups with more than 4 members', () => {
    const largeGroup: Group = {
      id: 'g4',
      name: 'Large Group',
      currency: 'USD',
      members: ['p1', 'p2', 'p3', 'p4', 'p5'],
      groupType: 'household'
    }

    render(<GroupList {...defaultProps} groups={[...mockGroups, largeGroup]} />)
    
    // Should show +1 count for the 5th member
    expect(screen.getByText('+1')).toBeInTheDocument()
  })

  it('should handle empty groups list', () => {
    render(<GroupList {...defaultProps} groups={[]} />)
    
    // Should still render the add group button
    expect(screen.getByRole('button', { name: /add group/i })).toBeInTheDocument()
  })

  it('should handle groups with no members', () => {
    const emptyGroup: Group = {
      id: 'g4',
      name: 'Empty Group',
      currency: 'USD',
      members: [],
      groupType: 'household'
    }

    render(<GroupList {...defaultProps} groups={[emptyGroup]} />)
    
    expect(screen.getByText('Empty Group')).toBeInTheDocument()
    // Should not show any avatars or member count
    expect(screen.queryByTestId(/avatar-/)).not.toBeInTheDocument()
    expect(screen.queryByText(/^\+/)).not.toBeInTheDocument()
  })

  it('should render avatars with correct size', () => {
    render(<GroupList {...defaultProps} />)
    
    const avatars = screen.getAllByTestId(/avatar-/)
    avatars.forEach(avatar => {
      expect(avatar).toHaveAttribute('data-size', 'sm')
    })
  })
})
