import 'firebase/auth'
import * as firebase from 'firebase/app'

import { Account, AuthLogic, AuthProviderType } from '@/logic/types'
import { BaseLogic } from '@/logic/base'
import { Component } from 'vue-property-decorator'
import { NoCache } from '@/base/decorators'
import { store } from '@/store'
const cloneDeep = require('lodash/cloneDeep')

@Component
export class AuthLogicImpl extends BaseLogic implements AuthLogic {
  //----------------------------------------------------------------------
  //
  //  Lifecycle hooks
  //
  //----------------------------------------------------------------------

  async created() {
    this.m_googleProvider = new firebase.auth.GoogleAuthProvider()
    this.m_googleProvider.addScope('https://www.googleapis.com/auth/contacts.readonly')

    this.m_facebookProvider = new firebase.auth.FacebookAuthProvider()
    this.m_facebookProvider.addScope('user_birthday')

    firebase.auth().onAuthStateChanged(this.m_firebaseOnAuthStateChanged)
  }

  //----------------------------------------------------------------------
  //
  //  Properties
  //
  //----------------------------------------------------------------------

  @NoCache
  get account(): Account {
    return cloneDeep(store.account.value)
  }

  //----------------------------------------------------------------------
  //
  //  Variables
  //
  //----------------------------------------------------------------------

  private m_googleProvider!: firebase.auth.GoogleAuthProvider

  private m_facebookProvider!: firebase.auth.FacebookAuthProvider

  //----------------------------------------------------------------------
  //
  //  Methods
  //
  //----------------------------------------------------------------------

  async checkSingedIn(): Promise<void> {
    let redirected: firebase.auth.UserCredential
    // リダイレクト式によるサインインの認証情報を取得
    redirected = await firebase.auth().getRedirectResult()

    if (redirected.credential) {
      // Googleのアクセストークンを取得
      // このトークンはGoogleAPIにアクセスする際に使用する
      const token = (redirected.credential as any).accessToken
    }
  }

  async signInWithGoogle(): Promise<void> {
    await firebase.auth().signInWithRedirect(this.m_googleProvider)
  }

  async signInWithFacebook(): Promise<void> {
    await firebase.auth().signInWithRedirect(this.m_facebookProvider)
  }

  async signInWithEmailAndPassword(email: string, password: string): Promise<{ result: boolean; code: string; errorMessage: string }> {
    try {
      await firebase.auth().signInWithEmailAndPassword(email, password)
      await this.m_refreshAccount()
    } catch (err) {
      return { result: false, code: err.code || '', errorMessage: err.message || '' }
    }
    return { result: true, code: '', errorMessage: '' }
  }

  async signInAnonymously(): Promise<{ result: boolean; code: string; errorMessage: string }> {
    try {
      await firebase.auth().signInAnonymously()
    } catch (err) {
      return { result: false, code: err.code || '', errorMessage: err.message || '' }
    }
    return { result: true, code: '', errorMessage: '' }
  }

  async createUserWithEmailAndPassword(
    email: string,
    password,
    profile: { displayName: string; photoURL: string | null }
  ): Promise<{ result: boolean; code: string; errorMessage: string }> {
    try {
      // メールアドレス＋パスワードでアカウント作成
      await firebase.auth().createUserWithEmailAndPassword(email, password)
      // 作成されたアカウントに表示名を設定
      await firebase.auth().currentUser!.updateProfile(profile)
    } catch (err) {
      return { result: false, code: err.code || '', errorMessage: err.message || '' }
    }

    await this.m_refreshAccount()

    return { result: true, code: '', errorMessage: '' }
  }

  async sendEmailVerification(continueURL: string): Promise<void> {
    const user = firebase.auth().currentUser
    if (!user) {
      const err = new Error('There is not account signed-in.')
      throw err
    }

    firebase.auth().languageCode = 'ja'
    await firebase.auth().currentUser!.sendEmailVerification({
      url: continueURL,
      handleCodeInApp: false,
    })
  }

  async sendPasswordResetEmail(email: string, continueURL: string): Promise<{ result: boolean; code: string; errorMessage: string }> {
    try {
      firebase.auth().languageCode = 'ja'
      await firebase.auth().sendPasswordResetEmail(email, {
        url: continueURL,
        handleCodeInApp: false,
      })
    } catch (err) {
      return { result: false, code: err.code || '', errorMessage: err.message || '' }
    }

    return { result: true, code: '', errorMessage: '' }
  }

  async signOut(): Promise<void> {
    await firebase.auth().signOut()
    await this.m_refreshAccount()
  }

  async deleteAccount(): Promise<{ result: boolean; code: string; errorMessage: string }> {
    const user = firebase.auth().currentUser
    if (!user) {
      return { result: false, code: '', errorMessage: 'There is not account signed-in.' }
    }

    try {
      await user.delete()
      await this.m_refreshAccount()
    } catch (err) {
      return { result: false, code: err.code || '', errorMessage: err.message || '' }
    }

    return { result: true, code: '', errorMessage: '' }
  }

  async updateEmail(newEmail: string): Promise<{ result: boolean; code: string; errorMessage: string }> {
    const user = firebase.auth().currentUser
    if (!user) {
      return { result: false, code: '', errorMessage: 'There is not account signed-in.' }
    }

    try {
      firebase.auth().languageCode = 'ja'
      await user.updateEmail(newEmail)
      await this.m_refreshAccount()
    } catch (err) {
      return { result: false, code: err.code || '', errorMessage: err.message || '' }
    }

    return { result: true, code: '', errorMessage: '' }
  }

  async fetchSignInMethodsForEmail(email: string): Promise<AuthProviderType[]> {
    return (await firebase.auth().fetchSignInMethodsForEmail(email)) as AuthProviderType[]
  }

  //----------------------------------------------------------------------
  //
  //  Internal methods
  //
  //----------------------------------------------------------------------

  private async m_refreshAccount(): Promise<void> {
    const user = firebase.auth().currentUser
    if (user) {
      let isSignedIn = true
      // アカウントがメールアドレスを持っている場合
      if (user.email) {
        // アカウントが持つ認証プロバイダの中にパスワード認証があるか調べる
        const providers = await this.fetchSignInMethodsForEmail(user.email)
        const passwordProviderExists = providers.some(provider => provider === AuthProviderType.Password)
        // アカウントが持つ認証プロバイダがパスワード認証のみでかつ、
        // メールアドレス確認が行われていない場合
        if (passwordProviderExists && providers.length === 1 && !user.emailVerified) {
          isSignedIn = false
        }
      }
      store.account.set({
        isSignedIn: isSignedIn,
        displayName: user.displayName || '',
        photoURL: user.photoURL || '',
        email: user.email || '',
        emailVerified: user.emailVerified,
      })
    } else {
      store.account.set({
        isSignedIn: false,
        displayName: '',
        photoURL: '',
        email: '',
        emailVerified: false,
      })
    }
  }

  //----------------------------------------------------------------------
  //
  //  Event listeners
  //
  //----------------------------------------------------------------------

  /**
   * Firebaseの認証状態が変化した際のリスナです。
   * @param user
   */
  private async m_firebaseOnAuthStateChanged(user: firebase.User | null) {
    await this.m_refreshAccount()
  }
}
