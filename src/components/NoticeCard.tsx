import React from 'react';
import { Card, Typography, Button, Icon } from 'antd';
import styles from './NoticeCard.module.css';
import moment from 'moment';
import { CardProps } from 'antd/lib/card';
import { File } from '../types/models';
import axios from 'axios';

export interface NoticeCardProps extends CardProps {
  title: string;
  content: string;
  files?: File[];
  updatedAt: Date;
  onEditPress?: () => void;
}

const NoticeCard: React.FC<NoticeCardProps> = props => {
  const { title, content, files, updatedAt, onEditPress, ...restProps } = props;
  return (
    <Card className={styles.card} title={title} hoverable {...restProps}>
      <Typography.Text className={styles.content}>{content}</Typography.Text>
      <div className={styles.files}>
        {files &&
          files.map(file => (
            <Button
              key={file.url}
              className={styles.file}
              type="primary"
              shape="round"
              icon="download"
              size="small"
              href={axios.defaults.baseURL + file.url}
              target="_blank"
              download={file.filename}
            >
              {file.filename}
            </Button>
          ))}
      </div>
      <div className={styles.dateContainer}>
        {onEditPress && (
          <Icon style={{ marginRight: 5 }} type="edit" onClick={onEditPress} />
        )}
        <Typography.Text className={styles.date}>
          {'编辑于 ' + moment(updatedAt).fromNow()}
        </Typography.Text>
      </div>
    </Card>
  );
};

export default NoticeCard;
