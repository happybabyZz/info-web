import React, { useEffect, useState, useRef } from 'react';
import styles from './MentorApplicationPage.module.css';
import {
  Timeline,
  Typography,
  Table,
  Modal,
  Input,
  message,
  Button,
  Descriptions,
  Spin,
  Badge,
  List,
  Icon,
  Empty,
  Switch
} from 'antd';
import { FormComponentProps } from 'antd/lib/form';
import Form, { WrappedFormUtils } from 'antd/lib/form/Form';
import {
  MentorApplication,
  MentorApplicationData,
  User,
  MentorAvailableData
} from '../types/models';
import moment from 'moment';
import { useMutation, useSubscription, useQuery } from '@apollo/react-hooks';
import gql from 'graphql-tag';
import { TableProps, ColumnProps, FilterDropdownProps } from 'antd/lib/table';
import './MentorApplicationPage.css';
import jwtDecode from 'jwt-decode';
import axios from 'axios';
import { client } from '../data';

export interface MentorApplicationPageProps {
  setPage: ({ key }: { key: string }) => void;
}

type MentorInfo = Partial<User> & {
  totalApplicants: number;
  available: boolean;
  matched: number;
};

const MentorApplicationPage: React.FC<MentorApplicationPageProps> = ({
  setPage
}) => {
  setPage({ key: 'mentor-application' });

  const { data: localData } = useQuery<{ token: string }>(gql`
    {
      token @client
    }
  `);
  const user: User = jwtDecode(localData!.token);

  const searchInput = useRef<Input>(null);

  const getColumnSearchProps: (
    dataIndex: keyof User,
    name: string
  ) => Partial<ColumnProps<MentorInfo>> = (dataIndex, name) => ({
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

  const columns: TableProps<MentorInfo>['columns'] = [
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      ...getColumnSearchProps('name', '姓名')
    },
    {
      title: '院系',
      dataIndex: 'department',
      key: 'department',
      filters: [
        {
          text: '电子系',
          value: '电子系'
        },
        {
          text: '微纳电子系',
          value: '微纳电子系'
        },
        {
          text: '医学院',
          value: '医学院'
        }
      ],
      onFilter: (value, record) => record.department === value
    },
    {
      title: '申请人数',
      dataIndex: 'totalApplicants',
      key: 'totalApplicants',
      sorter: (a, b) => a.totalApplicants - b.totalApplicants
    },
    {
      title: '操作',
      key: 'action',
      render: (text, record) => (
        <Button
          onClick={() => {
            setSelectedMentor(record);
            setFormVisible(true);
          }}
          disabled={(mentor && true) || !record.available}
        >
          申请
        </Button>
      )
    }
  ];

  const columnsForCounselor: TableProps<MentorInfo>['columns'] = [
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      ...getColumnSearchProps('name', '姓名')
    },
    {
      title: '院系',
      dataIndex: 'department',
      key: 'department',
      filters: [
        {
          text: '电子系',
          value: '电子系'
        },
        {
          text: '微纳电子系',
          value: '微纳电子系'
        },
        {
          text: '医学院',
          value: '医学院'
        }
      ],
      onFilter: (value, record) => record.department === value
    },
    {
      title: '申请人数',
      dataIndex: 'totalApplicants',
      key: 'totalApplicants',
      sorter: (a, b) => a.totalApplicants - b.totalApplicants
    },
    {
      title: '匹配人数',
      dataIndex: 'matched',
      key: 'matched',
      sorter: (a, b) => a.matched - b.matched
    },
    {
      title: '正在接收',
      dataIndex: 'available',
      key: 'available',
      filters: [
        {
          text: '是',
          value: 'true'
        },
        {
          text: '否',
          value: 'false'
        }
      ],
      onFilter: (value, record) => record.available.toString() === value,
      render: (text, record) => (record.available ? '是' : '否')
    }
  ];

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

  const [
    addApplication,
    {
      loading: addApplicationLoading,
      error: addApplicationError,
      data: addApplicationData
    }
  ] = useMutation<MentorApplicationData>(gql`
    mutation addApplication(
      $studentId: bigint!
      $mentorId: bigint!
      $statement: String!
      $createdBy: bigint!
    ) {
      insert_mentor_application(
        objects: {
          student_id: $studentId
          mentor_id: $mentorId
          statement: $statement
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

  const [selectedMentor, setSelectedMentor] = useState<MentorInfo>();
  const [mentorList, setMentorList] = useState<MentorInfo[]>([]);

  useEffect(() => {
    if (addApplicationError) {
      message.error('申请提交失败');
    }
    if (!addApplicationError && addApplicationData) {
      message.success('申请提交成功');

      setMentorList(
        mentorList.map(mentor => {
          if (mentor.id === selectedMentor!.id) {
            return {
              ...mentor,
              totalApplicants: mentor.totalApplicants + 1
            };
          } else {
            return mentor;
          }
        })
      );

      setFormVisible(false);
      setSelectedMentor(undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addApplicationError, addApplicationData]);

  const [
    updateApplication,
    {
      loading: updateApplicationLoading,
      error: updateApplicationError,
      data: updateApplicationData
    }
  ] = useMutation<MentorApplicationData>(gql`
    mutation updateApplication(
      $id: uuid!
      $statement: String!
      $updatedBy: bigint!
    ) {
      update_mentor_application(
        where: { id: { _eq: $id } }
        _set: { statement: $statement, updated_by: $updatedBy }
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
      setSelectedMentor(undefined);
    }
  }, [updateApplicationError, updateApplicationData]);

  const [
    updateApplicationStatus,
    {
      loading: updateApplicationStatusLoading,
      error: updateApplicationStatusError,
      data: updateApplicationStatusData
    }
  ] = useMutation<MentorApplicationData>(gql`
    mutation updateApplicationStatus(
      $id: uuid!
      $status: String!
      $updatedBy: bigint!
    ) {
      update_mentor_application(
        where: { id: { _eq: $id } }
        _set: { status: $status, updated_by: $updatedBy }
      ) {
        returning {
          id
        }
      }
    }
  `);

  useEffect(() => {
    if (updateApplicationStatusError) {
      message.error('申请状态更新失败');
    }
    if (!updateApplicationStatusError && updateApplicationStatusData) {
      message.success('申请状态更新成功');
    }
  }, [updateApplicationStatusError, updateApplicationStatusData]);

  const [formVisible, setFormVisible] = useState(false);
  const [formData, setFormData] = useState<MentorApplication>();

  const handleApplicationCreate = (
    form: WrappedFormUtils<MentorApplication>
  ) => {
    form.validateFields((err, values) => {
      if (err) {
        return;
      } else {
        if (formData) {
          updateApplication({
            variables: {
              id: formData.id,
              statement: values.statement,
              updatedBy: user.id
            }
          });
        } else {
          Modal.confirm({
            title: '确认提交新生导师申请？',
            content: '导师一旦选中，不可更改。',
            onOk() {
              addApplication({
                variables: {
                  studentId: user.id,
                  mentorId: selectedMentor!.id,
                  statement: values.statement,
                  createdBy: user.id
                }
              });
            }
          });
        }
      }
    });
  };

  const {
    loading: applicationLoading,
    error: applicationSubscriptionError,
    data: applicationData
  } = useSubscription<MentorApplicationData>(
    gql`
      subscription SubscriptionApplication($id: bigint!) {
        mentor_application(
          where: {
            _or: [{ student_id: { _eq: $id } }, { mentor_id: { _eq: $id } }]
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

  const [mentor, setMentor] = useState<MentorInfo>();

  useEffect(() => {
    if (
      user.group === 'student' &&
      applicationData &&
      applicationData.mentor_application.length !== 0
    ) {
      const teacherId = applicationData.mentor_application[0].mentor_id;

      axios
        .get(`/v1/users/${teacherId}?detailInfo=true`)
        .then(response => {
          const teacher = response.data as MentorInfo;
          setMentor(teacher);
        })
        .catch(() => message.error('申请加载失败'));
    }
  }, [applicationData, user.group]);

  const [students, setStudents] = useState<User[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);

  useEffect(() => {
    if (
      user.group === 'teacher' &&
      applicationData &&
      applicationData.mentor_application
    ) {
      (async () => {
        setStudentsLoading(true);
        const results = await Promise.all(
          applicationData.mentor_application.map(async application => {
            const studentId = application.student_id;

            try {
              const response = await axios.get(
                `/v1/users/${studentId}?detailInfo=true`
              );
              return response.data;
            } catch (err) {
              return err;
            }
          })
        );

        const validResults = results.filter(
          result => !(result instanceof Error)
        );
        setStudents(validResults);
        setStudentsLoading(false);
      })();
    }
  }, [applicationData, user.group]);

  useEffect(() => {
    if (applicationSubscriptionError) {
      message.error('申请加载失败');
    }
  }, [applicationSubscriptionError]);

  const [mentorListLoading, setMentorListLoading] = useState(false);

  useEffect(() => {
    if (user.group === 'student' || user.role === 'counselor') {
      setMentorListLoading(true);

      axios
        .get('/v1/users?isTeacher=true&detailInfo=true')
        .then(async response => {
          const teachers = response.data as User[];
          const teachersInfo = await Promise.all(
            teachers.map(async teacher => {
              const { data, errors } = await client.query({
                query: gql`
                  query GetTotalApplicants($id: bigint!) {
                    mentor_application_aggregate(
                      where: { mentor_id: { _eq: $id } }
                    ) {
                      aggregate {
                        count
                      }
                      nodes {
                        id
                        status
                      }
                    }
                  }
                `,
                variables: {
                  id: teacher.id
                }
              });

              if (errors) {
                throw errors;
              }

              const {
                data: availableData,
                errors: availableErrors
              } = await client.query<MentorAvailableData>({
                query: gql`
                  query MentorAvailable($id: bigint!) {
                    mentor_available(where: { mentor_id: { _eq: $id } }) {
                      id
                      available
                    }
                  }
                `,
                variables: {
                  id: teacher.id
                }
              });

              if (availableErrors) {
                throw availableErrors;
              }

              if (
                availableData &&
                availableData.mentor_available &&
                availableData.mentor_available[0]
              ) {
                return {
                  ...teacher,
                  key: teacher.id,
                  totalApplicants:
                    data.mentor_application_aggregate.aggregate.count,
                  available: availableData.mentor_available[0].available,
                  matched: data.mentor_application_aggregate.nodes.filter(
                    (i: MentorApplication) => i.status === 'approved'
                  ).length
                };
              } else {
                return {
                  ...teacher,
                  key: teacher.id,
                  totalApplicants:
                    data.mentor_application_aggregate.aggregate.count,
                  available: true,
                  matched: data.mentor_application_aggregate.nodes.filter(
                    (i: MentorApplication) => i.status === 'approved'
                  ).length
                };
              }
            })
          );

          setMentorList(teachersInfo);
          setMentorListLoading(false);
        })
        .catch(() => {
          message.error('导师列表加载失败');
          setMentorListLoading(false);
        });
    }
  }, [user.group, user.role]);

  const handleApplicationApprove = (
    checked: boolean,
    item: MentorApplication
  ) => {
    updateApplicationStatus({
      variables: {
        id: item.id,
        status: checked ? 'approved' : 'submitted',
        updatedBy: user.id
      }
    });
  };

  const {
    loading: mentorAvailableLoading,
    error: mentorAvailableError,
    data: mentorAvailableData
  } = useQuery<MentorAvailableData>(
    gql`
      query MentorAvailable($id: bigint!) {
        mentor_available(where: { mentor_id: { _eq: $id } }) {
          id
          available
        }
      }
    `,
    {
      variables: {
        id: user.id
      },
      skip: user.group !== 'teacher'
    }
  );

  useEffect(() => {
    if (mentorAvailableError) {
      message.error('接收状态获取失败');
    }
  }, [mentorAvailableError]);

  const [
    updateMentorAvailable,
    {
      loading: updateMentorAvailableLoading,
      error: updateMentorAvailableError,
      data: updateMentorAvailableData
    }
  ] = useMutation<MentorAvailableData>(gql`
    mutation updateMentorAvailable($id: bigint!, $available: Boolean!) {
      insert_mentor_available(
        objects: { available: $available, mentor_id: $id }
        on_conflict: {
          constraint: mentor_available_mentor_id_key
          update_columns: available
        }
      ) {
        returning {
          id
          available
        }
      }
    }
  `);

  useEffect(() => {
    if (updateMentorAvailableError) {
      message.error('接收状态更新失败');
    }
    if (
      !updateMentorAvailableError &&
      updateMentorAvailableData &&
      updateMentorAvailableData.mentor_available
    ) {
      setMentorAvailable(
        updateMentorAvailableData.mentor_available[0].available
      );
      message.success('接收状态更新成功');
    }
  }, [updateMentorAvailableError, updateMentorAvailableData]);

  const [mentorAvailable, setMentorAvailable] = useState(true);

  useEffect(() => {
    if (mentorAvailableData && mentorAvailableData.mentor_available) {
      setMentorAvailable(
        mentorAvailableData.mentor_available[0]
          ? mentorAvailableData.mentor_available[0].available
          : true
      );
    }
  }, [mentorAvailableData]);

  const handleMentorAvailable = (checked: boolean) => {
    updateMentorAvailable({
      variables: {
        id: user.id,
        available: checked
      }
    });
  };

  return (
    <div className={styles.root}>
      <Typography.Title level={2}>关键时间点</Typography.Title>
      <Timeline className={styles.timeline}>
        <Timeline.Item color="blue">
          <p>第一阶段：自由申请与匹配</p>
          <p>2019-09-04 00:00 ~ 2019-09-11 23:59</p>
        </Timeline.Item>
        <Timeline.Item color="gray">
          <p>第二阶段：未匹配同学补选</p>
          <p>2019-09-12 00:00 ~ 2019-09-16 23:59</p>
        </Timeline.Item>
        <Timeline.Item color="gray">
          <p>第三阶段：系统随机分配</p>
          <p>2019-09-17 00:00 ~ 2019-09-22 23:59</p>
        </Timeline.Item>
      </Timeline>
      {(user.group === 'student' || user.group === 'teacher') && (
        <>
          <Typography.Title level={2}>已申请</Typography.Title>
          <div className={styles.table}>
            {user.group === 'student' && (
              <Spin style={{ margin: 24 }} spinning={applicationLoading}>
                {applicationData &&
                applicationData.mentor_application &&
                applicationData.mentor_application.length !== 0 &&
                mentor ? (
                  <Descriptions bordered size="small">
                    <Descriptions.Item label="导师姓名" span={2}>
                      {mentor!.name}
                    </Descriptions.Item>
                    <Descriptions.Item label="导师院系">
                      {mentor!.department}
                    </Descriptions.Item>
                    <Descriptions.Item label="申请时间" span={2}>
                      {moment(
                        applicationData.mentor_application[0].created_at
                      ).format('llll')}
                    </Descriptions.Item>
                    <Descriptions.Item label="申请状态">
                      {applicationData.mentor_application[0].status ===
                      'submitted' ? (
                        <Badge status="processing" text="已提交" />
                      ) : applicationData.mentor_application[0].status ===
                        'approved' ? (
                        <Badge status="success" text="已通过" />
                      ) : (
                        <Badge status="error" text="未通过" />
                      )}
                    </Descriptions.Item>
                    <Descriptions.Item label="申请陈述" span={3}>
                      <Typography.Text style={{ wordWrap: 'break-word' }}>
                        {applicationData.mentor_application[0].statement}
                      </Typography.Text>
                      <br />
                      <br />
                      <Button
                        onClick={() => {
                          setSelectedMentor(mentor);
                          setFormData(applicationData.mentor_application[0]);
                          setFormVisible(true);
                        }}
                      >
                        编辑
                      </Button>
                    </Descriptions.Item>
                  </Descriptions>
                ) : (
                  <Empty />
                )}
              </Spin>
            )}
            {user.group === 'teacher' && (
              <div>
                <Switch
                  loading={
                    updateMentorAvailableLoading || mentorAvailableLoading
                  }
                  checkedChildren="正在接收申请"
                  unCheckedChildren="停止接收申请"
                  checked={mentorAvailable}
                  onChange={checked => handleMentorAvailable(checked)}
                />
                <List
                  loading={applicationLoading || studentsLoading}
                  dataSource={
                    applicationData && students.length !== 0
                      ? applicationData.mentor_application
                      : []
                  }
                  renderItem={item => {
                    const student = students.find(
                      i => i.id === item.student_id
                    )!;
                    return (
                      <Descriptions
                        style={{ margin: '24px auto' }}
                        key={item.id}
                        bordered
                        size="small"
                      >
                        <Descriptions.Item label="学生姓名" span={2}>
                          {student.name}
                        </Descriptions.Item>
                        <Descriptions.Item label="学生院系">
                          {student.department}
                        </Descriptions.Item>
                        <Descriptions.Item label="申请时间" span={2}>
                          {moment(item.created_at).format('llll')}
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
                          <Typography.Text style={{ wordWrap: 'break-word' }}>
                            {item.statement}
                          </Typography.Text>
                          <br />
                          <br />
                          <Switch
                            loading={updateApplicationStatusLoading}
                            checkedChildren="通过"
                            unCheckedChildren="拒绝"
                            defaultChecked={item.status === 'approved'}
                            onChange={checked =>
                              handleApplicationApprove(checked, item)
                            }
                          />
                        </Descriptions.Item>
                      </Descriptions>
                    );
                  }}
                />
              </div>
            )}
          </div>
        </>
      )}
      {user.group === 'student' && (
        <>
          <Typography.Title level={2}>导师列表</Typography.Title>
          <Table
            loading={mentorListLoading}
            className={styles.table}
            dataSource={mentorList}
            columns={columns}
          />
          <WrappedNewApplicationForm
            visible={formVisible}
            loading={addApplicationLoading || updateApplicationLoading}
            onCancel={() => {
              setFormVisible(false);
              setSelectedMentor(undefined);
            }}
            onCreate={handleApplicationCreate}
            data={formData}
            mentor={selectedMentor}
          />
        </>
      )}
      {user.role === 'counselor' && (
        <>
          <Typography.Title level={2}>导师列表</Typography.Title>
          <Table
            loading={mentorListLoading}
            className={styles.table}
            dataSource={mentorList}
            columns={columnsForCounselor}
          />
        </>
      )}
    </div>
  );
};

export default MentorApplicationPage;

interface NewApplicationFormProps extends FormComponentProps {
  onCancel: () => void;
  onCreate: (form: WrappedFormUtils<any>) => void;
  loading: boolean;
  visible: boolean;
  data?: MentorApplication;
  mentor?: MentorInfo;
}

const NewApplicationForm: React.FC<NewApplicationFormProps> = props => {
  const { visible, onCancel, onCreate, form, data, loading, mentor } = props;
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
        <Form.Item label="导师姓名">
          {getFieldDecorator('mentorName', {
            initialValue: mentor && mentor.name
          })(<Input readOnly />)}
        </Form.Item>
        <Form.Item label="导师院系">
          {getFieldDecorator('mentorName', {
            initialValue: mentor && mentor.department
          })(<Input readOnly />)}
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
            />
          )}
        </Form.Item>
      </Form>
    </Modal>
  );
};

const WrappedNewApplicationForm = Form.create<NewApplicationFormProps>()(
  NewApplicationForm
);
