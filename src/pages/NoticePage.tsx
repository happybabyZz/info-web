import React, { useState, useEffect } from 'react';
import styles from './NoticePage.module.css';
import {
  List,
  Modal,
  Form,
  Input,
  Button,
  Typography,
  message,
  Upload,
  Icon
} from 'antd';
import NoticeCard from '../components/NoticeCard';
import { FormComponentProps } from 'antd/lib/form';
import { Notice, NoticeData, File, User } from '../types/models';
import { useMutation, useSubscription, useQuery } from '@apollo/react-hooks';
import gql from 'graphql-tag';
import { WrappedFormUtils } from 'antd/lib/form/Form';
import { UploadFile, UploadProps } from 'antd/lib/upload/interface';
import axios from 'axios';
import jwtDecode from 'jwt-decode';

export interface NoticePageProps {
  setPage: ({ key }: { key: string }) => void;
}

const NoticePage: React.FC<NoticePageProps> = ({ setPage }) => {
  setPage({ key: 'notice' });

  const { data: localData } = useQuery<{ token: string }>(gql`
    {
      token @client
    }
  `);
  const user: User = jwtDecode(localData!.token);

  const [infoFormVisible, setInfoFormVisible] = useState(
    user.username.toString() === user.id.toString() &&
      !sessionStorage.getItem('usernameSet')
  );
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [department, setDepartment] = useState('');

  const handleInfoUpdate = async () => {
    if (!username) {
      message.error('请填写用户名');
      return false;
    }
    if (!password) {
      message.error('请设置密码');
      return false;
    }
    if (!department) {
      message.error('请填写院系');
      return false;
    }

    try {
      await axios.put(`/v1/users/${user.id}`, {
        username,
        password,
        department
      });
      setInfoFormVisible(false);
      sessionStorage.setItem('usernameSet', 'true');
      message.success('信息更新成功');
    } catch {
      message.error('信息更新失败');
      return false;
    }
  };

  const [formVisible, setFormVisible] = useState(false);

  const {
    loading: noticeLoading,
    error: noticeQueryError,
    data
  } = useSubscription<NoticeData>(gql`
    {
      notice(order_by: { created_at: desc }) {
        id
        title
        content
        created_at
        updated_at
        files
      }
    }
  `);

  useEffect(() => {
    if (noticeQueryError) {
      message.error('公告加载失败');
    }
  }, [noticeQueryError]);

  const [
    addNotice,
    { loading: mutationLoading, error: mutationError, data: mutationData }
  ] = useMutation<NoticeData>(gql`
    mutation addNotice(
      $title: String!
      $created_by: bigint!
      $content: String!
      $files: String
    ) {
      insert_notice(
        objects: {
          title: $title
          content: $content
          created_by: $created_by
          files: $files
          updated_by: $created_by
        }
      ) {
        returning {
          id
        }
      }
    }
  `);

  useEffect(() => {
    if (mutationError) {
      message.error('公告发布失败');
    }
    if (!mutationError && mutationData) {
      message.success('公告发布成功');
      setFormVisible(false);
      setFormData(undefined);
    }
  }, [mutationError, mutationData]);

  const [
    updateNotice,
    { loading: updateLoading, error: updateError, data: updateData }
  ] = useMutation<NoticeData>(gql`
    mutation updateNotice(
      $id: uuid!
      $title: String!
      $content: String!
      $files: String
      $updatedBy: bigint!
    ) {
      update_notice(
        where: { id: { _eq: $id } }
        _set: {
          title: $title
          content: $content
          files: $files
          updated_by: $updatedBy
        }
      ) {
        returning {
          id
        }
      }
    }
  `);

  useEffect(() => {
    if (updateError) {
      message.error('公告编辑失败');
    }
    if (!updateError && updateData) {
      message.success('公告编辑成功');
      setFormVisible(false);
      setFormData(undefined);
    }
  }, [updateError, updateData]);

  const handleNewNoticeCreate = (
    form: WrappedFormUtils<Notice>,
    files: File[]
  ) => {
    form.validateFields((err, values) => {
      if (err) {
        return;
      } else {
        if (formData) {
          updateNotice({
            variables: {
              id: formData.id,
              title: values.title,
              content: values.content,
              files: JSON.stringify(files),
              updatedBy: user.id
            }
          });
        } else {
          addNotice({
            variables: {
              title: values.title,
              content: values.content,
              created_by: user.id,
              files: JSON.stringify(files)
            }
          });
        }
      }
    });
  };

  const [formData, setFormData] = useState<Notice>();

  return (
    <div className={styles.root}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <Typography.Title level={2}>公告</Typography.Title>
        {user.role === 'counselor' && (
          <Button
            style={{ marginBottom: 12 }}
            onClick={() => setFormVisible(true)}
          >
            新公告
          </Button>
        )}
      </div>
      <List
        className={styles.list}
        dataSource={data && data.notice}
        renderItem={item => (
          <NoticeCard
            style={{ margin: 24 }}
            onEditPress={
              user.role === 'counselor'
                ? () => {
                    setFormData(item);
                    setFormVisible(true);
                  }
                : undefined
            }
            title={item.title}
            content={item.content}
            updatedAt={item.updated_at}
            files={JSON.parse(item.files) as File[]}
          />
        )}
        loading={noticeLoading}
      />
      <WrappedNewNoticeForm
        loading={mutationLoading || updateLoading}
        visible={formVisible}
        onCreate={handleNewNoticeCreate}
        onCancel={() => {
          setFormVisible(false);
          setFormData(undefined);
        }}
        data={formData}
      />
      <Modal
        visible={infoFormVisible}
        title="重要信息补全"
        centered
        closable={false}
        onOk={handleInfoUpdate}
        maskClosable={false}
        footer={[
          <Button key="submit" type="primary" onClick={handleInfoUpdate}>
            更新
          </Button>
        ]}
      >
        <Form layout="vertical">
          <Form.Item required label="用户名">
            <Input
              placeholder="请设置用户名；用户名与邮箱均可用于系统登录"
              value={username}
              onChange={e => setUsername(e.target.value)}
            />
          </Form.Item>
          <Form.Item required label="密码">
            <Input.Password
              placeholder="请设置新密码"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </Form.Item>
          <Form.Item required label="院系">
            <Input
              placeholder="请补充您的院系，如：电子系"
              value={department}
              onChange={e => setDepartment(e.target.value)}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default NoticePage;

interface NewNoticeFormProps extends FormComponentProps {
  onCancel: () => void;
  onCreate: (form: WrappedFormUtils<any>, files: File[]) => void;
  loading: boolean;
  visible: boolean;
  data?: Notice;
}

const NewNoticeForm: React.FC<NewNoticeFormProps> = props => {
  const { visible, onCancel, onCreate, form, data, loading } = props;
  const { getFieldDecorator } = form;

  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [files, setFiles] = useState<File[]>([]);

  const handleFileListChange: UploadProps['onChange'] = ({
    file,
    fileList
  }) => {
    if (file.status === 'error') {
      message.error('附件上传失败');
      setFileList(fileList.filter(f => f.originFileObj !== file.originFileObj));
    } else {
      setFiles(
        fileList.map(f => ({
          filename: f.name,
          url: f.response
        }))
      );
      setFileList([...fileList]);
    }
  };

  const handleFileRemove: UploadProps['onRemove'] = async file => {
    try {
      await axios.delete(file.response);
      setFiles(files.filter(f => f.url !== file.response));
      setFileList(fileList.filter(f => f.originFileObj !== file.originFileObj));
    } catch {
      message.error('附件删除失败');
      return false;
    }
  };

  useEffect(() => {
    if (data) {
      const files = JSON.parse(data.files) as File[];
      setFiles(files);
      setFileList(
        files.map(f => ({
          response: f.url,
          status: 'done',
          uid: f.url,
          size: 0,
          name: f.filename,
          type: ''
        }))
      );
    }
  }, [data]);

  return (
    <Modal
      visible={visible}
      title={data ? '编辑公告' : '新公告'}
      centered
      destroyOnClose
      okText="发布"
      onCancel={onCancel}
      onOk={() => onCreate(form, files)}
      maskClosable={false}
      confirmLoading={loading}
    >
      <Form layout="vertical">
        <Form.Item label="标题">
          {getFieldDecorator('title', {
            initialValue: data && data.title,
            rules: [
              {
                required: true,
                message: '请输入公告标题'
              }
            ]
          })(<Input />)}
        </Form.Item>
        <Form.Item label="正文">
          {getFieldDecorator('content', {
            initialValue: data && data.content,
            rules: [
              {
                required: true,
                message: '请输入公告正文'
              }
            ]
          })(
            <Input.TextArea
              style={{ resize: 'none' }}
              autosize={{ minRows: 5 }}
            />
          )}
        </Form.Item>
      </Form>
      <Upload
        action={`${axios.defaults.baseURL}/static/files`}
        headers={{
          Authorization: axios.defaults.headers['Authorization']
        }}
        onChange={handleFileListChange}
        onRemove={handleFileRemove}
        multiple
        fileList={fileList}
      >
        <Button>
          <Icon type="upload" /> 上传附件
        </Button>
      </Upload>
    </Modal>
  );
};

const WrappedNewNoticeForm = Form.create<NewNoticeFormProps>()(NewNoticeForm);
