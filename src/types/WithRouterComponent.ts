import { RouteComponentProps } from 'react-router-dom';

/**
 * @param P props.match.params
 * @param T component props
 */

export type WithRouterComponent<P, T> = RouteComponentProps<P> & T;
