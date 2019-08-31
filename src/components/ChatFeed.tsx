import React, { useRef, useEffect } from 'react';
import { List, Spin, message } from 'antd';
import ChatBubble from '../components/ChatBubble';
import styles from './ChatFeed.module.css';
import { useSubscription } from '@apollo/react-hooks';
import gql from 'graphql-tag';
import { MessageData } from '../types/models';
import Scrollbars from 'react-custom-scrollbars';

export interface ChatFeedProps {
  from: number;
  to: number;
}

const ChatFeed: React.FC<ChatFeedProps> = ({ from, to }) => {
  const scrollBarRef = useRef<Scrollbars>(null);

  const { data, loading, error } = useSubscription<MessageData>(
    gql`
      subscription GetMessages($from: bigint!, $to: bigint!) {
        mentor_message(
          order_by: { created_at: asc }
          where: {
            _or: [
              { _and: { from: { _eq: $from }, to: { _eq: $to } } }
              { _and: { from: { _eq: $to }, to: { _eq: $from } } }
            ]
          }
        ) {
          created_at
          from
          id
          payload
          to
        }
      }
    `,
    {
      variables: {
        from,
        to
      }
    }
  );

  useEffect(() => {
    if (error) {
      message.error('聊天记录加载失败');
    }
  }, [error]);

  useEffect(() => {
    if (
      !loading &&
      data &&
      data.mentor_message.length !== 0 &&
      scrollBarRef.current
    ) {
      scrollBarRef.current.scrollToBottom();
    }
  }, [loading, data]);

  return (
    <div className={styles.root}>
      <Scrollbars ref={scrollBarRef} style={{ marginBottom: -20 }}>
        <List
          style={{ padding: '0px 20px' }}
          split={false}
          dataSource={data && data.mentor_message}
          renderItem={item => (
            <List.Item key={item.id} style={{ padding: '6px 0' }}>
              <ChatBubble
                position={from === item.from ? 'right' : 'left'}
                text={JSON.parse(item.payload).text}
                date={item.created_at}
              />
            </List.Item>
          )}
        >
          {loading && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center'
              }}
            >
              <Spin />
            </div>
          )}
        </List>
      </Scrollbars>
    </div>
  );
};

export default ChatFeed;
