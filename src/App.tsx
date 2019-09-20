import React, { useState } from 'react';
import {
  Layout,
  Menu,
  Icon,
  ConfigProvider,
  BackTop,
  Button,
  Typography,
  Result
} from 'antd';
import styles from './App.module.css';
import logo from './assets/logo.png';
import zhCN from 'antd/es/locale/zh_CN';
import moment from 'moment';
import 'moment/locale/zh-cn';
import {
  BrowserRouter as Router,
  Link,
  Switch,
  Route,
  Redirect
} from 'react-router-dom';
import NoticePage from './pages/NoticePage';
import MentorApplicationPage from './pages/MentorApplicationPage';
import MentorChatPage from './pages/MentorChatPage';
import LoginPage from './pages/LoginPage';
import { ApolloProvider } from '@apollo/react-hooks';
import { client } from './data';
import AuthRoute from './components/AuthRoute';
import UserButton from './components/UserButton';
import ScholarshipApplicationPage from './pages/ScholarshipApplicationPage';

moment.locale('zh-cn');

const { Header, Content, Footer, Sider } = Layout;
const { Title } = Typography;
const { SubMenu } = Menu;

const App: React.FC = () => {
  const [selectedKey, setSelectedKey] = useState('notice');

  const handleMenuSelection = ({ key }: { key: string }) => setSelectedKey(key);

  return (
    <ApolloProvider client={client}>
      <ConfigProvider locale={zhCN}>
        <Router>
          <Layout>
            <Header className={styles.header}>
              <div className={styles.logoContainer}>
                <img className={styles.logo} src={logo} alt="logo" />
                <Title style={{ margin: 'auto', marginLeft: 10 }} level={3}>
                  EESAST
                </Title>
              </div>
              <Menu
                className={styles.topMenu}
                theme="light"
                mode="horizontal"
                defaultSelectedKeys={['info']}
                selectedKeys={['info']}
              >
                <Menu.Item key="home">
                  <a href="https://eesast.com/home">首页</a>
                </Menu.Item>
                <Menu.Item key="weekly">
                  <a href="https://eesast.com/weekly">Weekly</a>
                </Menu.Item>
                <Menu.Item key="edc">
                  <a href="https://eesast.com/thuedc">电子设计大赛</a>
                </Menu.Item>
                <Menu.Item key="info">Info</Menu.Item>
              </Menu>
              <div className={styles.toolbar}>
                <UserButton />
              </div>
            </Header>
            <Layout>
              <Switch>
                <Route exact path="/login" component={LoginPage} />
                <AuthRoute>
                  <Sider className={styles.sider}>
                    <Menu
                      theme="light"
                      mode="inline"
                      defaultSelectedKeys={['notice']}
                      selectedKeys={[selectedKey]}
                      onSelect={handleMenuSelection}
                    >
                      <Menu.Item key="notice">
                        <Link to="/notices">
                          <Icon type="notification" />
                          公告
                        </Link>
                      </Menu.Item>
                      <SubMenu
                        key="mentor"
                        title={
                          <span>
                            <Icon type="team" />
                            <span>新生导师</span>
                          </span>
                        }
                      >
                        <Menu.Item key="mentor-application">
                          <Link to="/mentors/applications">导师申请</Link>
                        </Menu.Item>
                        <Menu.Item key="mentor-chat">
                          <Link to="/mentors/chats">导师交流</Link>
                        </Menu.Item>
                      </SubMenu>
                      <Menu.Item key="scholarship">
                        <Link to="/scholarships">
                          <Icon type="trophy" />
                          奖学金
                        </Link>
                      </Menu.Item>
                      <Menu.Item key="financialAid">
                        <Link to="/financial-aid">
                          <Icon type="pay-circle" />
                          助学金
                        </Link>
                      </Menu.Item>
                    </Menu>
                  </Sider>
                  <Layout>
                    <Content className={styles.content}>
                      <Switch>
                        <Redirect exact from="/" to="/notices" />
                        <Route
                          exact
                          path="/notices"
                          render={() => (
                            <NoticePage setPage={handleMenuSelection} />
                          )}
                        />
                        <Route
                          exact
                          path="/mentors/applications"
                          render={() => (
                            <MentorApplicationPage
                              setPage={handleMenuSelection}
                            />
                          )}
                        />
                        <Route
                          exact
                          path="/mentors/chats"
                          render={() => (
                            <MentorChatPage setPage={handleMenuSelection} />
                          )}
                        />
                        <Route
                          exact
                          path="/scholarships"
                          render={() => (
                            <ScholarshipApplicationPage
                              setPage={handleMenuSelection}
                            />
                          )}
                        />
                        <Route
                          render={() => (
                            <Result
                              status="404"
                              title="404"
                              subTitle="您所访问的页面不存在"
                              extra={
                                <Button type="primary">
                                  <Link to="/">返回主页</Link>
                                </Button>
                              }
                            />
                          )}
                        />
                      </Switch>
                    </Content>
                    <Footer className={styles.footer}>© 2019 EESAST</Footer>
                  </Layout>
                </AuthRoute>
              </Switch>
            </Layout>
          </Layout>
          <BackTop />
        </Router>
      </ConfigProvider>
    </ApolloProvider>
  );
};

export default App;
