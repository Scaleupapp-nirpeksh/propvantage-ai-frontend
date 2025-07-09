import React from 'react'
import { Card, Typography } from 'antd'
import { Settings } from 'lucide-react'

const { Title } = Typography

const TowersPage = () => {
    return (
      <Card>
        <Title level={2}>Towers</Title> {/* Corrected Title */}
        <p>Coming soon...</p>
      </Card>
    )
  }

export default TowersPage