import styles from './ScholarshipApplicationPage.module.css';
import React, { useEffect, useState, useRef } from 'react';
import {
  Typography,
  Timeline,
  List,
  Descriptions,
  message,
  Modal,
  Button,
  Select,
  Input,
  Badge,
  Icon,
  Switch
} from 'antd';
import { useQuery, useMutation, useSubscription } from '@apollo/react-hooks';
import { User, HonorApplicationData, HonorApplication } from '../types/models';
import jwtDecode from 'jwt-decode';
import gql from 'graphql-tag';
import Form, { WrappedFormUtils, FormComponentProps } from 'antd/lib/form/Form';
import isUrl from 'is-url';
import Table, {
  TableProps,
  ColumnProps,
  FilterDropdownProps
} from 'antd/lib/table';
import { client } from '../data';
import axios from 'axios';

export interface ScholarshipApplicationPageProps {
  setPage: ({ key }: { key: string }) => void;
}

type HonorApplicationInfo = HonorApplication &
  User & {
    id: string;
    student_id: number;
  };

const ScholarshipApplicationPage: React.FC<ScholarshipApplicationPageProps> = ({
  setPage
}) => {
  setPage({ key: 'scholarship' });

  const { data: localData } = useQuery<{ token: string }>(gql`
    {
      token @client
    }
  `);
  const user: User = jwtDecode(localData!.token);

  const [
    addApplication,
    {
      loading: addApplicationLoading,
      error: addApplicationError,
      data: addApplicationData
    }
  ] = useMutation<HonorApplicationData>(gql`
    mutation addApplication(
      $studentId: bigint!
      $honor: String!
      $statement: String!
      $attachmentUrl: String!
      $createdBy: bigint!
    ) {
      insert_honor_application(
        objects: {
          student_id: $studentId
          honor: $honor
          statement: $statement
          attachment_url: $attachmentUrl
          created_by: $createdBy
          updated_by: $createdBy
        }
      ) {
        returning {
          id
        }
      }
    }
  `);

  useEffect(() => {
    if (addApplicationError) {
      message.error('申请提交失败');
    }
    if (!addApplicationError && addApplicationData) {
      message.success('申请提交成功');

      setFormVisible(false);
    }
  }, [addApplicationError, addApplicationData]);

  const [
    updateApplication,
    {
      loading: updateApplicationLoading,
      error: updateApplicationError,
      data: updateApplicationData
    }
  ] = useMutation<HonorApplicationData>(gql`
    mutation updateApplication(
      $id: uuid!
      $honor: String!
      $statement: String!
      $attachmentUrl: String!
      $updatedBy: bigint!
    ) {
      update_honor_application(
        where: { id: { _eq: $id } }
        _set: {
          honor: $honor
          statement: $statement
          attachment_url: $attachmentUrl
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
    if (updateApplicationError) {
      message.error('申请编辑失败');
    }
    if (!updateApplicationError && updateApplicationData) {
      message.success('申请编辑成功');
      setFormVisible(false);
    }
  }, [updateApplicationError, updateApplicationData]);

  const [
    deleteApplication,
    { error: deleteApplicationError, data: deleteApplicationData }
  ] = useMutation<HonorApplicationData>(gql`
    mutation deleteApplication($id: uuid!) {
      delete_honor_application(where: { id: { _eq: $id } }) {
        returning {
          id
        }
      }
    }
  `);

  useEffect(() => {
    if (deleteApplicationError) {
      message.error('申请删除失败');
    }
    if (!deleteApplicationError && deleteApplicationData) {
      message.success('申请删除成功');
    }
  }, [deleteApplicationError, deleteApplicationData]);

  const {
    loading: applicationLoading,
    error: applicationSubscriptionError,
    data: applicationData
  } = useSubscription<HonorApplicationData>(
    gql`
      subscription SubscriptionApplication($id: bigint!) {
        honor_application(
          where: { student_id: { _eq: $id } }
          order_by: { created_at: asc }
        ) {
          id
          honor
          student_id
          statement
          attachment_url
          status
          created_at
          updated_at
        }
      }
    `,
    {
      variables: {
        id: user.id
      },
      skip: user.role === 'counselor'
    }
  );

  useEffect(() => {
    if (applicationSubscriptionError) {
      message.error('申请加载失败');
    }
  }, [applicationSubscriptionError]);

  const [formVisible, setFormVisible] = useState(false);
  const [formData, setFormData] = useState<HonorApplication>();

  const handleApplicationCreate = (
    form: WrappedFormUtils<HonorApplication>
  ) => {
    form.validateFields((err, values) => {
      if (err) {
        return;
      } else {
        console.log(values);
        if (formData) {
          updateApplication({
            variables: {
              id: formData.id,
              honor: values.honor,
              statement: values.statement,
              attachmentUrl: values.attachment_url || '',
              updatedBy: user.id
            }
          });
        } else {
          addApplication({
            variables: {
              studentId: user.id,
              honor: values.honor,
              statement: values.statement,
              attachmentUrl: values.attachment_url || '',
              createdBy: user.id
            }
          });
        }
      }
    });
  };

  const handleApplicationDelete = (id: string) => {
    Modal.confirm({
      title: '确认删除该荣誉申请？',
      content: '申请一旦删除，无法恢复。',
      onOk() {
        deleteApplication({
          variables: {
            id
          }
        });
      }
    });
  };

  const searchInput = useRef<Input>(null);

  const getColumnSearchProps: (
    dataIndex: keyof HonorApplicationInfo,
    name: string
  ) => Partial<ColumnProps<HonorApplicationInfo>> = (dataIndex, name) => ({
    filterDropdown: ({
      setSelectedKeys,
      selectedKeys,
      confirm,
      clearFilters
    }) => (
      <div style={{ padding: 8 }}>
        <Input
          ref={searchInput}
          placeholder={`搜索${name}`}
          value={selectedKeys![0]}
          onChange={e =>
            setSelectedKeys!(e.target.value ? [e.target.value] : [])
          }
          onPressEnter={() => handleSearch(selectedKeys, confirm)}
          style={{ width: 188, marginBottom: 8, display: 'block' }}
        />
        <Button
          type="primary"
          onClick={() => handleSearch(selectedKeys, confirm)}
          icon="search"
          size="small"
          style={{ width: 90, marginRight: 8 }}
        >
          搜索
        </Button>
        <Button
          onClick={() => handleReset(clearFilters)}
          size="small"
          style={{ width: 90 }}
        >
          重置
        </Button>
      </div>
    ),
    filterIcon: filtered => (
      <Icon type="search" style={{ color: filtered ? '#027dcd' : undefined }} />
    ),
    onFilter: (value, record) =>
      record[dataIndex]!.toString()
        .toLowerCase()
        .includes(value.toLowerCase()),
    onFilterDropdownVisibleChange: visible => {
      if (visible) {
        setTimeout(() => searchInput.current && searchInput.current.select());
      }
    }
  });

  const honorColumnsForCounselor: TableProps<
    HonorApplicationInfo
  >['columns'] = [
    {
      title: '学号',
      dataIndex: 'student_id',
      key: 'student_id',
      ...getColumnSearchProps('student_id', '学号')
    },
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      ...getColumnSearchProps('name', '姓名')
    },
    {
      title: '班级',
      dataIndex: 'class',
      key: 'class',
      ...getColumnSearchProps('class', '班级')
    },
    {
      title: '荣誉类型',
      dataIndex: 'honor',
      key: 'honor',
      filters: [
        {
          text: '学业优秀奖',
          value: '学业优秀奖'
        },
        {
          text: '学习进步奖',
          value: '学习进步奖'
        },
        {
          text: '社会工作优秀奖',
          value: '社会工作优秀奖'
        },
        {
          text: '科技创新优秀奖',
          value: '科技创新优秀奖'
        },
        {
          text: '社会实践优秀奖',
          value: '社会实践优秀奖'
        },
        {
          text: '志愿公益优秀奖',
          value: '志愿公益优秀奖'
        },
        {
          text: '体育优秀奖',
          value: '体育优秀奖'
        },
        {
          text: '文艺优秀奖',
          value: '文艺优秀奖'
        },
        {
          text: '综合优秀奖',
          value: '综合优秀奖'
        },
        {
          text: '无校级荣誉',
          value: '无校级荣誉'
        },
        {
          text: '好读书奖',
          value: '好读书奖'
        }
      ],
      onFilter: (value, record) => record.honor === value
    },
    {
      title: '申请状态',
      dataIndex: 'status',
      key: 'status',
      filters: [
        {
          text: '已提交',
          value: 'submitted'
        },
        {
          text: '未通过',
          value: 'rejected'
        },
        {
          text: '已通过',
          value: 'approved'
        }
      ],
      onFilter: (value, record) => record.status === value,
      render: (text, record) =>
        text === 'submitted'
          ? '已提交'
          : text === 'rejected'
          ? '未通过'
          : '已通过'
    },
    {
      title: '操作',
      key: 'action',
      render: (text, record) => (
        <Switch
          checked={record.status === 'approved'}
          checkedChildren="已通过"
          unCheckedChildren="未通过"
          loading={updateApplicationStatusLoading}
          onChange={checked => {
            handleApplicationApprove(checked, record);
          }}
        />
      )
    }
  ];

  const [applicationsForCounselors, setApplicationsForCounselors] = useState<
    HonorApplicationInfo[]
  >([]);
  const [
    applicationsForCounselorsLoading,
    setApplicationsForCounselorsLoading
  ] = useState(false);

  useEffect(() => {
    if (user.role === 'counselor') {
      setApplicationsForCounselorsLoading(true);
      (async () => {
        try {
          const { data, errors } = await client.query<HonorApplicationData>({
            query: gql`
              query GetTotalApplications {
                honor_application {
                  id
                  honor
                  statement
                  attachment_url
                  status
                  student_id
                }
              }
            `
          });

          if (errors) {
            throw errors;
          }

          const applications = data.honor_application;
          const applicationsWithInfo = await Promise.all<HonorApplicationInfo>(
            applications.map(async i => {
              try {
                const response = await axios.get<User>(
                  `/v1/users/${i.student_id}?detailInfo=true`
                );
                return {
                  ...i,
                  ...response.data,
                  id: i.id
                };
              } catch (err) {
                return err;
              }
            })
          );

          setApplicationsForCounselors(
            applicationsWithInfo.filter(result => !(result instanceof Error))
          );
        } catch {
          message.error('申请加载失败');
        } finally {
          setApplicationsForCounselorsLoading(false);
        }
      })();
    }
  }, [user.role]);

  const [
    updateApplicationStatus,
    {
      loading: updateApplicationStatusLoading,
      error: updateApplicationStatusError,
      data: updateApplicationStatusData
    }
  ] = useMutation(gql`
    mutation updateApplicationStatus(
      $id: uuid!
      $status: String!
      $updatedBy: bigint!
    ) {
      update_honor_application(
        where: { id: { _eq: $id } }
        _set: { status: $status, updated_by: $updatedBy }
      ) {
        returning {
          id
          status
        }
      }
    }
  `);

  const [updatingApplicationId, setUpdatingApplicationId] = useState('');

  useEffect(() => {
    if (updateApplicationStatusError) {
      message.error('申请状态更新失败');
    }
    if (
      !updateApplicationStatusError &&
      updateApplicationStatusData &&
      updateApplicationStatusData.update_honor_application &&
      updateApplicationStatusData.update_honor_application.returning &&
      updateApplicationStatusData.update_honor_application.returning[0]
    ) {
      const newApplications = applicationsForCounselors.map(i => {
        if (i.id === updatingApplicationId) {
          return {
            ...i,
            status:
              updateApplicationStatusData.update_honor_application.returning[0]
                .status
          };
        } else {
          return i;
        }
      });
      setApplicationsForCounselors(newApplications);
      setUpdatingApplicationId('');
      message.success('申请状态更新成功');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateApplicationStatusError, updateApplicationStatusData]);

  const handleApplicationApprove = (
    checked: boolean,
    item: HonorApplication
  ) => {
    setUpdatingApplicationId(item.id);
    updateApplicationStatus({
      variables: {
        id: item.id,
        status: checked ? 'approved' : 'rejected',
        updatedBy: user.id
      }
    });
  };

  const [, setSearchText] = useState('');

  const handleSearch = (
    selectedKeys: FilterDropdownProps['selectedKeys'],
    confirm: FilterDropdownProps['confirm']
  ) => {
    confirm && confirm();
    setSearchText(selectedKeys![0]);
  };

  const handleReset = (clearFilters: FilterDropdownProps['clearFilters']) => {
    clearFilters && clearFilters([]);
    setSearchText('');
  };

  return (
    <div className={styles.root}>
      <Typography.Title level={2}>关键时间点</Typography.Title>
      <Timeline className={styles.timeline}>
        <Timeline.Item color="green">
          <p>第一阶段：奖学金荣誉申请</p>
          <p>2019-09-22 00:00 ~ 2019-09-23 23:59</p>
        </Timeline.Item>
        <Timeline.Item color="green">
          <p>第二阶段：奖学金申请结果公示</p>
          <p>2019-10-08 00:00 ~ 2019-10-10 23:59</p>
        </Timeline.Item>
      </Timeline>
      <Typography.Title level={2}>荣誉</Typography.Title>
      {user.role !== 'counselor' && (
        <>
          <Button onClick={() => setFormVisible(true)}>申请荣誉</Button>
          <div className={styles.table}>
            {user.group === 'student' && (
              <List
                loading={applicationLoading}
                dataSource={
                  applicationData ? applicationData.honor_application : []
                }
                renderItem={item => {
                  return (
                    <Descriptions
                      style={{ margin: '24px auto' }}
                      key={item.id}
                      bordered
                      size="small"
                    >
                      <Descriptions.Item label="荣誉类型" span={2}>
                        {item.honor}
                      </Descriptions.Item>
                      <Descriptions.Item label="申请状态">
                        {item.status === 'submitted' ? (
                          <Badge status="processing" text="已提交" />
                        ) : item.status === 'approved' ? (
                          <Badge status="success" text="已通过" />
                        ) : (
                          <Badge status="error" text="未通过" />
                        )}
                      </Descriptions.Item>
                      <Descriptions.Item label="申请陈述" span={3}>
                        <Typography.Text
                          style={{
                            wordWrap: 'break-word',
                            whiteSpace: 'pre-wrap'
                          }}
                        >
                          {item.statement}
                        </Typography.Text>
                      </Descriptions.Item>
                      <Descriptions.Item label="申请材料" span={2}>
                        {item.attachment_url && isUrl(item.attachment_url) ? (
                          <a
                            href={item.attachment_url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {item.attachment_url}
                          </a>
                        ) : (
                          item.attachment_url || '无'
                        )}
                      </Descriptions.Item>
                      <Descriptions.Item label="操作">
                        <Button
                          style={{ margin: 5 }}
                          disabled={item.status !== 'submitted'}
                          onClick={() => {
                            setFormData(item);
                            setFormVisible(true);
                          }}
                        >
                          编辑
                        </Button>
                        <Button
                          style={{ margin: 5 }}
                          type="danger"
                          onClick={() => handleApplicationDelete(item.id)}
                        >
                          删除
                        </Button>
                      </Descriptions.Item>
                    </Descriptions>
                  );
                }}
              />
            )}
          </div>
        </>
      )}
      {user.role === 'counselor' && (
        <Table
          loading={applicationsForCounselorsLoading}
          className={styles.table}
          dataSource={applicationsForCounselors}
          columns={honorColumnsForCounselor}
          rowKey="id"
          expandedRowRender={record => (
            <Descriptions key={record.id} size="small">
              <Descriptions.Item label="申请陈述" span={3}>
                <Typography.Text
                  style={{
                    wordWrap: 'break-word',
                    whiteSpace: 'pre-wrap'
                  }}
                >
                  {record.statement}
                </Typography.Text>
              </Descriptions.Item>
              <Descriptions.Item label="申请材料" span={3}>
                {record.attachment_url && isUrl(record.attachment_url) ? (
                  <a
                    href={record.attachment_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {record.attachment_url}
                  </a>
                ) : (
                  record.attachment_url || '无'
                )}
              </Descriptions.Item>
            </Descriptions>
          )}
        />
      )}
      {user.role !== 'counselor' && (
        <WrappedNewApplicationForm
          visible={formVisible}
          loading={addApplicationLoading || updateApplicationLoading}
          onCancel={() => {
            setFormVisible(false);
          }}
          onCreate={handleApplicationCreate}
          data={formData}
        />
      )}
    </div>
  );
};

export default ScholarshipApplicationPage;

interface NewApplicationFormProps extends FormComponentProps {
  onCancel: () => void;
  onCreate: (form: WrappedFormUtils<any>) => void;
  loading: boolean;
  visible: boolean;
  data?: HonorApplication;
}

const NewApplicationForm: React.FC<NewApplicationFormProps> = props => {
  const { visible, onCancel, onCreate, form, data, loading } = props;
  const { getFieldDecorator } = form;

  return (
    <Modal
      visible={visible}
      title={data ? '编辑申请' : '新申请'}
      centered
      destroyOnClose
      okText="提交"
      onCancel={onCancel}
      onOk={() => onCreate(form)}
      maskClosable={false}
      confirmLoading={loading}
    >
      <Form layout="vertical">
        <Form.Item label="荣誉">
          {getFieldDecorator('honor', {
            initialValue: data && data.honor,
            rules: [{ required: true, message: '请选择所申请的荣誉类型' }]
          })(
            <Select placeholder="荣誉类型">
              <Select.Option value="学业优秀奖">学业优秀奖</Select.Option>
              <Select.Option value="学习进步奖">学习进步奖</Select.Option>
              <Select.Option value="社会工作优秀奖">
                社会工作优秀奖
              </Select.Option>
              <Select.Option value="科技创新优秀奖">
                科技创新优秀奖
              </Select.Option>
              <Select.Option value="社会实践优秀奖">
                社会实践优秀奖
              </Select.Option>
              <Select.Option value="志愿公益优秀奖">
                志愿公益优秀奖
              </Select.Option>
              <Select.Option value="体育优秀奖">体育优秀奖</Select.Option>
              <Select.Option value="文艺优秀奖">文艺优秀奖</Select.Option>
              <Select.Option value="综合优秀奖">综合优秀奖</Select.Option>
              <Select.Option value="无校级荣誉">无校级荣誉</Select.Option>
              <Select.Option value="好读书奖">好读书奖</Select.Option>
            </Select>
          )}
        </Form.Item>
        <Form.Item label="申请陈述">
          {getFieldDecorator('statement', {
            initialValue: data && data.statement,
            rules: [
              {
                required: true,
                message: '请输入申请陈述'
              }
            ]
          })(
            <Input.TextArea
              style={{ resize: 'none' }}
              autosize={{ minRows: 5 }}
              placeholder="与所申请荣誉相对应的申请陈述"
            />
          )}
        </Form.Item>
        <Form.Item label="申请材料链接">
          {getFieldDecorator('attachment_url', {
            initialValue: data && data.attachment_url
          })(
            <Input placeholder="推荐使用清华云盘上传文件并在此粘贴分享链接" />
          )}
        </Form.Item>
      </Form>
    </Modal>
  );
};

const WrappedNewApplicationForm = Form.create<NewApplicationFormProps>()(
  NewApplicationForm
);
