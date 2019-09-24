import React, { useState, useEffect } from 'react';
import styles from './MentorChatPage.module.css';
import ChatFeed from '../components/ChatFeed';
import { Typography, Input, Button, Menu, message, Result, Spin } from 'antd';
import { useQuery, useSubscription, useMutation } from '@apollo/react-hooks';
import gql from 'graphql-tag';
import jwtDecode from 'jwt-decode';
import { User, MentorApplicationData, MessageData } from '../types/models';
import axios from 'axios';
import { Link } from 'react-router-dom';

export interface MentorChatPageProps {
  setPage: ({ key }: { key: string }) => void;
}

const MentorChatPage: React.FC<MentorChatPageProps> = ({ setPage }) => {
  setPage({ key: 'mentor-chat' });

  const { data: localData } = useQuery<{ token: string }>(gql`
    {
      token @client
    }
  `);
  const user: User = jwtDecode(localData!.token);

  const [selectedUserKey, setSelectedUserKey] = useState('');
  const [selectedUser, setSelectedUser] = useState<User>();

  const {
    loading: applicationLoading,
    error: applicationSubscriptionError,
    data: applicationData
  } = useSubscription<MentorApplicationData>(
    gql`
      subscription SubscriptionApplication($id: bigint!) {
        mentor_application(
          where: {
            _and: [
              {
                _or: [{ student_id: { _eq: $id } }, { mentor_id: { _eq: $id } }]
              }
              { status: { _eq: "approved" } }
            ]
          }
          order_by: { created_at: asc }
        ) {
          id
          student_id
          mentor_id
          statement
          status
          created_at
          updated_at
        }
      }
    `,
    {
      variables: {
        id: user.id
      }
    }
  );

  const [infoLoading, setInfoLoading] = useState(false);

  const [mentor, setMentor] = useState<User>();

  useEffect(() => {
    if (
      user.group === 'student' &&
      applicationData &&
      applicationData.mentor_application.length !== 0
    ) {
      setInfoLoading(true);
      const teacherId = applicationData.mentor_application[0].mentor_id;

      axios
        .get(`/v1/users/${teacherId}?detailInfo=true`)
        .then(response => {
          const teacher = response.data as User;
          setMentor(teacher);
          setSelectedUser(teacher);
        })
        .catch(() => message.error('导师信息加载失败'))
        .finally(() => {
          setInfoLoading(false);
        });
    }
  }, [applicationData, user.group]);

  const [students, setStudents] = useState<User[]>([]);

  useEffect(() => {
    if (
      user.group === 'teacher' &&
      applicationData &&
      applicationData.mentor_application
    ) {
      (async () => {
        setInfoLoading(true);

        const studentIds = applicationData.mentor_application.map(
          i => i.student_id
        );

        try {
          const results = (await axios.post(`/v1/users?detailInfo=true`, {
            ids: studentIds
          })).data;

          setStudents(results);
          if (results.length !== 0) {
            setSelectedUser(results[0]);
            setSelectedUserKey(results[0].id.toString());
          }
        } catch {
          message.error('学生信息加载失败');
        } finally {
          setInfoLoading(false);
        }
      })();
    }
  }, [applicationData, user.group]);

  useEffect(() => {
    if (applicationSubscriptionError) {
      message.error('信息加载失败');
    }
  }, [applicationSubscriptionError]);

  const [
    addMessage,
    { loading: addMessageLoading, error: addMessageError, data: addMessageData }
  ] = useMutation<MessageData>(gql`
    mutation addMessage($from: bigint!, $to: bigint!, $payload: String!) {
      insert_mentor_message(
        objects: { from: $from, to: $to, payload: $payload }
      ) {
        returning {
          id
        }
      }
    }
  `);

  useEffect(() => {
    if (addMessageError) {
      message.error('信息发送失败');
    }
  }, [addMessageError]);

  const [text, setText] = useState('');

  const handleMessageSend = () => {
    if (!text.trim()) {
      return;
    }

    addMessage({
      variables: {
        from: user.id,
        to: selectedUser!.id,
        payload: JSON.stringify({
          text: text.trim()
        })
      }
    });
  };

  useEffect(() => {
    if (!addMessageLoading && addMessageData && !addMessageError) {
      setText('');
    }
  }, [addMessageData, addMessageError, addMessageLoading]);

  if (applicationLoading || infoLoading) {
    return (
      <div className={styles.root}>
        <Spin />
      </div>
    );
  }

  if (
    (user.group !== 'student' && user.group !== 'teacher') ||
    (user.group === 'student' && !mentor) ||
    (user.group === 'teacher' && students.length === 0)
  ) {
    return (
      <Result
        status="info"
        title="您尚未配对"
        extra={
          <Link to="/mentors/applications">
            <Button type="primary">查看申请</Button>
          </Link>
        }
      />
    );
  }

  return (
    <div className={styles.root}>
      {user.group === 'student' && (
        <Typography.Title level={2}>{`与导师 ${
          mentor!.name
        } 的聊天`}</Typography.Title>
      )}
      {user.group === 'teacher' && (
        <Typography.Title level={2}>{`与学生 ${
          selectedUser!.name
        } 的聊天`}</Typography.Title>
      )}
      <div className={styles.content}>
        {user.group === 'teacher' && (
          <Menu
            className={styles.contacts}
            selectedKeys={[selectedUserKey]}
            onSelect={({ key }) => {
              setSelectedUserKey(key);
              setSelectedUser(
                students.find((item: User) => item.id.toString() === key)
              );
            }}
          >
            {students.map(item => (
              <Menu.Item
                key={item.id.toString()}
                style={{ display: 'table', width: '100%', margin: 0 }}
              >
                {item.name}
              </Menu.Item>
            ))}
          </Menu>
        )}
        <div className={styles.chats}>
          <ChatFeed from={user.id} to={selectedUser!.id} />
          <Input.TextArea
            className={styles.textarea}
            autosize={{ minRows: 4, maxRows: 4 }}
            value={text}
            onChange={e => setText(e.target.value)}
          />
          <Button
            className={styles.sendButton}
            loading={addMessageLoading}
            onClick={handleMessageSend}
          >
            发送
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MentorChatPage;
