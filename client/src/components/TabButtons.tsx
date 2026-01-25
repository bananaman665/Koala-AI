interface TabButton {
  id: string
  label: string
  active: boolean
}

interface TabButtonsProps {
  tabs: TabButton[]
  onTabClick: (id: string) => void
}

export function TabButtons({ tabs, onTabClick }: TabButtonsProps) {
  return (
    <div className="flex gap-2 mb-4">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onTabClick(tab.id)}
          className={`
            flex-1 py-2 px-3 rounded-lg font-medium text-sm transition-colors
            ${tab.active
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }
          `}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
