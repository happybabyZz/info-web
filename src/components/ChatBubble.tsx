import React from 'react';
import styles from './ChatBubble.module.css';
import moment from 'moment';
import { Typography } from 'antd';

export interface ChatBubbleProps {
  text: string;
  date: Date;
  position: 'left' | 'right';
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ text, position, date }) => {
  return (
    <div
      className={styles.root}
      style={{
        justifyContent: position === 'left' ? 'flex-start' : 'flex-end'
      }}
    >
      <div
        className={styles.container}
        style={{ alignItems: position === 'left' ? 'flex-start' : 'flex-end' }}
      >
        <Typography.Text className={styles.bubble}>{text}</Typography.Text>
        <div className={styles.date}>{moment(date).calendar()}</div>
      </div>
    </div>
  );
};

export default ChatBubble;
