import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, ofType, createEffect } from '@ngrx/effects';
import { catchError, map, of, switchMap, tap } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AuthService } from '../auth.service';
import { User } from '../user.model';
import * as AuthActions from './auth.actions';

export interface AuthResponseData {
    kind: string;
    idToken: string;
    email: string;
    refreshToken: string;
    expiresIn: string;
    localId: string;
    registered?: boolean;
}

const handleAuthentication = (expiresIn: number, email: string, userId: string, token: string) => {
    const expirationDate = new Date(
        new Date().getTime() + expiresIn * 1000);

    const user = new User(email, userId, token, expirationDate);
    localStorage.setItem('userData', JSON.stringify(user));
    return new AuthActions.AuthenticateSuccess({
        email: email,
        userId: userId,
        token: token,
        expirationDate: expirationDate,
        redirect: true
    });
}

const handleError = (errorRes: any) => {
    let errorMessage = 'An unknown error occured';

    if (!errorRes.error || !errorRes.error.error) {
        return of(new AuthActions.AuthenticateFail(errorMessage))
    }

    switch (errorRes.error.error.message) {
        case 'EMAIL_EXISTS': {
            errorMessage = 'This email is already exist'
            break;
        }
        case 'OPERATION_NOT_ALLOWED': {
            errorMessage = 'Operation is not allowed'
            break
        }
        case 'TOO_MANY_ATTEMPTS_TRY_LATER': {
            errorMessage = 'Too many attempts, try again later'
            break
        }
        case 'EMAIL_NOT_FOUND': {
            errorMessage = 'Email is not found'
            break
        }
        case 'INVALID_PASSWORD': {
            errorMessage = 'Invalid password'
            break
        }
        case 'USER_DISABLED': {
            errorMessage = 'User is disabled'
            break
        }
        case 'default': {
            errorMessage
            break
        }
    }
    return of(new AuthActions.AuthenticateFail(errorMessage));
}

@Injectable()
export class AuthEffects {

    authSignup = createEffect(() =>
        this.actions$.pipe(
            ofType(AuthActions.SIGNUP_START),
            switchMap((signupAction: AuthActions.SignupStart) => {
                return this.http.post<AuthResponseData>('https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=' + environment.firebaseAPIKey,
                    {
                        email: signupAction.payload.email,
                        password: signupAction.payload.password,
                        returnSecureToken: true
                    })
                    .pipe(
                        tap(resData => {
                            this.authService.setLogoutTimer(+resData.expiresIn * 1000)
                        }),
                        map(resData => {
                            return handleAuthentication(+resData.expiresIn, resData.email, resData.localId, resData.idToken)
                        }),
                        catchError(errorRes => {
                            return handleError(errorRes)
                        })
                    )
            })
        )
    )

    authLogin = createEffect(() =>
        this.actions$.pipe(
            ofType(AuthActions.LOGIN_START),
            switchMap((authData: AuthActions.LoginStart) => {
                return this.http.post<AuthResponseData>('https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=' + environment.firebaseAPIKey,
                    {
                        email: authData.payload.email,
                        password: authData.payload.password,
                        returnSecureToken: true
                    }
                )
                    .pipe(
                        tap(resData => {
                            this.authService.setLogoutTimer(+resData.expiresIn * 1000)
                        }),
                        map(resData => {
                            return handleAuthentication(+resData.expiresIn, resData.email, resData.localId, resData.idToken)

                        }),
                        catchError(errorRes => {
                            return handleError(errorRes)
                        })
                    );
            })
        )
    )

    authRedirect = createEffect(() =>
        this.actions$.pipe(
            ofType(AuthActions.AUTHENTICATE_SUCCESS),
            tap((authSeccessAction: AuthActions.AuthenticateSuccess) => {
                if(authSeccessAction.payload.redirect) {
                    this.router.navigate(['/'])
                }
            }))
        ,
        { dispatch: false })


    authLogout = createEffect(() =>
        this.actions$.pipe(
            ofType(AuthActions.LOGOUT),
            tap(() => {
                this.authService.clearLogoutTime();
                localStorage.removeItem('userData');
                this.router.navigate(['/auth']);
            })
        ),
        { dispatch: false })

    autoLogin = createEffect(() =>
        this.actions$.pipe(
            ofType(AuthActions.AUTO_LOGIN),
            map(() => {
                const userData: {
                    email: string;
                    id: string;
                    _token: string;
                    _tokenExpirationDate: string;
                } = JSON.parse(localStorage.getItem('userData'));

                if (!userData) {
                    return { type: 'DUMMY' }
                }

                const loadedUser = new User(userData.email, userData.id, userData._token, new Date(userData._tokenExpirationDate))

                if (loadedUser.token) {
                     const expirationDuration = new Date(userData._tokenExpirationDate).getTime() - new Date().getTime();
                    this.authService.setLogoutTimer(expirationDuration)
                    return new AuthActions.AuthenticateSuccess({
                        email: loadedUser.email,
                        userId: loadedUser.id,
                        token: loadedUser.token,
                        expirationDate: new Date(userData._tokenExpirationDate),
                        redirect: false
                    })
                   
                }
                return { type: 'DUMMY' }
            })
        )
    )

    constructor(
        private actions$: Actions, 
        private http: HttpClient, 
        private router: Router,
        private authService: AuthService
        ) { }
}


