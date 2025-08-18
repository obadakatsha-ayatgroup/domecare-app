import React from 'react'
import { Link } from 'react-router-dom'

interface QuickAction {
  label: string
  icon: React.ReactNode
  href: string
}

interface QuickActionsProps {
  actions: QuickAction[]
}

const QuickActions: React.FC<QuickActionsProps> = ({ actions }) => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
      <div className="space-y-3">
        {actions.map((action, index) => (
          <Link
            key={index}
            to={action.href}
            className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="flex-shrink-0 text-primary-600">
              {action.icon}
            </div>
            <span className="ml-3 text-sm font-medium text-gray-900">
              {action.label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default QuickActions