import { Button, Card, Form, Icon, Input, message } from 'antd';
import { FormComponentProps } from 'antd/lib/form';
import React from 'react';
import { withRouter } from 'react-router-dom';
import { WithRouterComponent } from '../types/WithRouterComponent';
import styles from './LoginPage.module.css';
import axios from 'axios';
import { useApolloClient } from '@apollo/react-hooks';

const LoginPage: React.FC<WithRouterComponent<{}, {}>> = props => {
  const { history } = props;

  const client = useApolloClient();

  const submit = async (username: string, password: string) => {
    try {
      const response = await axios.post('/v1/users/login', {
        username,
        email: username,
        password
      });

      const token = response.data.token as string;
      client.writeData({
        data: {
          loggedIn: true,
          token
        }
      });
      axios.defaults.headers['Authorization'] = 'Bearer ' + token;

      message.success('登录成功');
      history.replace('/');
    } catch (err) {
      message.error('登录失败');
    }
  };

  return (
    <div className={styles.root}>
      <Card className={styles.card}>
        <WrappedLoginForm submit={submit} loggingIn={false} />
      </Card>
    </div>
  );
};

export default withRouter(LoginPage);

interface ILoginFormProps extends FormComponentProps {
  submit: (username: string, password: string) => void;
  loggingIn: boolean;
}

const LoginForm: React.FC<ILoginFormProps> = ({ form, submit, loggingIn }) => {
  const { getFieldDecorator } = form;

  const handleSubmit = () => {
    form.validateFields(async (err, values) => {
      if (!err && values.username && values.password) {
        submit(values.username, values.password);
      }
    });
  };

  return (
    <Form>
      <Form.Item>
        {getFieldDecorator('username', {
          rules: [{ required: true, message: '请输入用户名' }]
        })(
          <Input
            prefix={<Icon type="user" style={{ color: 'rgba(0,0,0,.25)' }} />}
            placeholder="用户名"
            autoCapitalize="off"
            autoCorrect="off"
            autoComplete="on"
          />
        )}
      </Form.Item>
      <Form.Item>
        {getFieldDecorator('password', {
          rules: [{ required: true, message: '请输入密码' }]
        })(
          <Input.Password
            prefix={<Icon type="lock" style={{ color: 'rgba(0,0,0,.25)' }} />}
            type="password"
            placeholder="密码"
            autoComplete="on"
          />
        )}
      </Form.Item>
      <Form.Item>
        <a
          style={{ float: 'left' }}
          href="https://eesast.com/register"
          target="_blank"
          rel="noopener noreferrer"
        >
          注册
        </a>
        <a
          style={{ float: 'right' }}
          href="https://eesast.com/reset"
          target="_blank"
          rel="noopener noreferrer"
        >
          忘记密码？
        </a>
        <Button
          style={{ width: '100%' }}
          type="primary"
          htmlType="submit"
          onClick={handleSubmit}
          loading={loggingIn}
        >
          登录
        </Button>
      </Form.Item>
    </Form>
  );
};

const WrappedLoginForm = Form.create<ILoginFormProps>()(LoginForm);
