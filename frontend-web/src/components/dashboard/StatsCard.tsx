import React from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface StatsCardProps {
  title: string
  value: string
  icon: React.ReactNode
  change: string
  changeType: 'increase' | 'decrease' | 'neutral'
}

const StatsCard: React.FC<StatsCardProps> = ({ 
  title, 
  value, 
  icon, 
  change, 
  changeType 
}) => {
  const changeIcon = {
    increase: <TrendingUp className="h-4 w-4 text-green-500" />,
    decrease: <TrendingDown className="h-4 w-4 text-red-500" />,
    neutral: <Minus className="h-4 w-4 text-gray-500" />
  }

  const changeColor = {
    increase: 'text-green-600',
    decrease: 'text-red-600',
    neutral: 'text-gray-600'
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
          <div className="flex items-center mt-2">
            {changeIcon[changeType]}
            <span className={`text-sm ml-2 ${changeColor[changeType]}`}>
              {change}
            </span>
          </div>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg">
          {icon}
        </div>
      </div>
    </div>
  )
}

export default StatsCard