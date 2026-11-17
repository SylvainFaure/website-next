import * as THREE from 'three'
//import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import vertex from './shaders/vertex.glsl'
import fragment from './shaders/fragment.glsl'
import gsap, { Sine } from 'gsap'
import * as dat from 'dat.gui'
import ASScroll from '@ashthornton/asscroll'

export default class Scene {
  constructor({ modal, container, images = [], callback, eventHandlers, isMobile, options = {} }) {
    this.modal = modal
    this.modalOpened = false
    this.images = images
    this.container = container
    this.width = this.container.offsetWidth
    this.height = this.container.offsetHeight
    this.handlers = eventHandlers
    this.scene = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera(30, this.width/this.height, 10, 1000)
    this.camera.position.z = 600
    this.callback = callback
    this.wrapper = document.querySelector('section')
    this.header = document.querySelector('header')
    this.infos = document.querySelectorAll('.item__infos')
    this.stop = false
    this.isMobile = isMobile
    this.camera.fov = 2*Math.atan((this.height/2)/600) * 180/Math.PI

    this.renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true 
    })
    this.renderer.setPixelRatio(window.devicePixelRatio)

    this.renderer.setSize(this.width, this.height)
    this.container.appendChild(this.renderer.domElement)
    //this.controls = new OrbitControls(this.camera, this.renderer.domElement)

    this.time = 0
    // this.setupSettings()
    this.addObjects()
    this.asscroll = new ASScroll({
      disableRaf: true
    })
    this.asscroll.enable({
      horizontalScroll: !this.isMobile
    })
    this.resize()
    this.render()
    this.setupResize()
    this.handleModalClick()
  }

  setupSettings() {
    this.settings = {
      progress: 0
    }
    this.gui = new dat.GUI()
    this.gui.add(this.settings, "progress", 0, 1, 0.001)
  }

  resize() {
    this.width = this.container.offsetWidth
    this.height = this.container.offsetHeight
    this.renderer.setSize(this.width, this.height)
    this.camera.aspect = this.width / this.height
    this.camera.updateProjectionMatrix()

    this.camera.fov = 2*Math.atan((this.height/2)/600) * 180/Math.PI

    this.materials.forEach(material => {
      material.uniforms.uResolution.value.x = this.width
      material.uniforms.uResolution.value.y = this.height
    })

    this.imageStore.forEach(img => {
      let { width, height, top, left } = img.img.getBoundingClientRect()
      img.mesh.scale.set(width, height, 1)
      img.top = this.isMobile ? this.asscroll.currentPos + top : top
      img.left = this.isMobile ? left : this.asscroll.currentPos + left
      img.width = width
      img.height = height

      img.mesh.material.uniforms.uQuadSize.value.x = width
      img.mesh.material.uniforms.uQuadSize.value.y = height;
      img.mesh.material.uniforms.uTextureSize.value.x = width
      img.mesh.material.uniforms.uTextureSize.value.y = height;
    })
  }

  setupResize() {
    this.onResize = this.resize.bind(this)
    window.addEventListener('resize', this.onResize)
  }

  addObjects() {
    this.geometry = new THREE.PlaneGeometry(1, 1, 100, 100)
    // this.geometry = new THREE.SphereBufferGeometry(0.5, 80, 80)
    this.material = new THREE.ShaderMaterial({
        // wireframe: true,
        uniforms: {
          time: { value: 1.0 },
          uProgress: { value: 0.0 },
          uResolution: { value: new THREE.Vector2(this.width, this.height)},
          uQuadSize: { value: new THREE.Vector2(350, 350)},
          uTextureSize: { value: new THREE.Vector2(100, 100)},
          uCorners:{ value: new THREE.Vector4(0, 0, 0, 0)},
          uTexture: { value: new THREE.TextureLoader()}
        },
        vertexShader: vertex,
        fragmentShader: fragment
      }
    )
  
    this.materials = []
    
    this.imageStore = this.images.map(img => {
      let { top, left, width, height } = img.getBoundingClientRect()

      let m = this.material.clone()
      this.materials.push(m)

      let loader = new THREE.TextureLoader()
      loader.crossOrigin = ''

      let texture = loader.load(
        img.getAttribute('src'),
        (texture) => {
          // console.log('loaded', texture)
        },
        (error) => {
          console.warn(error)
        }
      )
      // TextureLoader flags the texture for upload once the image has loaded
      m.uniforms.uTexture.value = texture

      let mesh = new THREE.Mesh(this.geometry, m)
      this.scene.add(mesh)
      mesh.scale.set(width, height, 1)
      const id = `image-${Math.floor(Math.random() * 10000)}`

      const onClick = (evt) => {
        if (this.handlers && this.handlers.animationOn) {
          this.handlers.animationOn(evt)
        }
        this.handleOnAnimation(id)
      }
      img.addEventListener('click', onClick)

      return {
        id,
        img,
        mesh,
        material: m,
        texture,
        onClick,
        width: 350, height: 300, top, left
      }
    })
    this.callback()
    // console.log(this.imageStore)
  }

  handleModalClick () {
    this.onModalClick = (evt) => {
      const classList = Array.from(evt.target.classList)
      if (!classList.includes('modal-content') && !classList.includes('modal-content__cta-link')) {
        this.handleOffAnimation()
        this.modalOpened = false
        if (this.handlers && this.handlers.animationOff) {
          this.handlers.animationOff()
        }
      }
    }
    this.modal.addEventListener('click', this.onModalClick)
  }

  frontAnimation (img) {
    const { material } = img
    this.tlOn = gsap.timeline()
      .to(material.uniforms.uProgress, {
        value: 1,
        duration: 0.7,
        ease: Sine.easeOut
      }, 0)
      .to(material.uniforms.uCorners.value, {
        x: 1,
        duration: 0.4
      }, 0)
      .to(material.uniforms.uCorners.value, {
        y: 1,
        duration: 0.4
      }, 0.1)
      .to(material.uniforms.uCorners.value, {
        z: 1,
        duration: 0.4
      }, 0.2)
      .to(material.uniforms.uCorners.value, {
        w: 1,
        duration: 0.4
      }, 0.3)
  }

  disappearAnimation (img) {
    const { mesh } = img
    this.disappearTl = gsap.timeline()
      .to(mesh.scale, {
        x: 0,
        y: 0,
        z: 0,
        w: 0,
        duration: 0.2
      })
  }
  restoreAnimation (img) {
    const { material, mesh, width, height } = img
    this.restoreTl = gsap.timeline()
      .to(material.uniforms.uProgress, {
        value: 0,
        duration: 0.7,
        ease: Sine.easeOut
      }, 0)
      .to(material.uniforms.uCorners.value, {
        w: 0,
        duration: 0.4
      }, 0)
      .to(mesh.scale, {
        x: width,
        y: height,
        z: 1,
        duration: 0.4
      }, 0.2)
      .to(material.uniforms.uCorners.value, {
        z: 0,
        duration: 0.4
      }, 0.1)
      .to(material.uniforms.uCorners.value, {
        x: 0,
        duration: 0.4
      }, 0.2)
      .to(material.uniforms.uCorners.value, {
        y: 0,
        duration: 0.4
      }, 0.3)
  
  }

  handleOnAnimation (id) {
    this.modal.classList.add('visible')
    this.modalOpened = true
    gsap.timeline()
      .to(this.wrapper, { opacity: 0, duration: 0.1 })
      .to(this.header, { opacity: 0, duration: 0.1 })
      .to(this.infos, { opacity: 0, duration: 0.1 })
    this.imageStore.forEach((image) => {
      if (image.id === id) {
        this.frontAnimation(image)
      } else {
        this.disappearAnimation(image)
      }
    })
  }

  handleOffAnimation () {
    this.modal.classList.remove('visible')
    gsap.timeline()
      .to(this.wrapper, { opacity: 1, duration: 0.1 })
      .to(this.header, { opacity: 1, duration: 0.1 })
      .to(this.infos, { opacity: 1, duration: 0.3 }, 0.5)
    this.imageStore.forEach((image) => {
      this.restoreAnimation(image)
    })
  }

  setPosition() {
    if (this.isMobile) {
      this.imageStore.forEach((obj, index) => {
        const currPos = obj.img.getBoundingClientRect()
        obj.mesh.position.x = obj.left - this.width / 2 + obj.width / 2
        obj.mesh.position.y = this.asscroll.currentPos + -obj.top + this.height / 2 - obj.height / 2
        const angle = (((window.innerHeight - currPos.top) / window.innerHeight) - 0.5)
        obj.mesh.rotation.x = angle * 3
      })
    } else {
      this.imageStore.forEach(obj => {
        const currPos = obj.img.getBoundingClientRect()
        obj.mesh.position.x = -this.asscroll.currentPos + obj.left - this.width / 2 + obj.width / 2
        obj.mesh.position.y = -obj.top + this.height / 2 - obj.height / 2
        const angle = ((window.innerWidth - currPos.left) / window.innerWidth) * 0.7
        obj.mesh.rotation.x = angle - 0.35
      })
    }
  }

  render() {
    if (this.stop) return
    this.time += 0.05
    this.material.uniforms.time.value = this.time
    // this.material.uniforms.uProgress.value = this.settings.progress
    // this.tl.progress(this.settings.progress)
    if (!this.modalOpened) {
      if (this.asscroll) {
        this.asscroll.update()
      }
      this.setPosition()
    }
    this.renderer.render(this.scene, this.camera)
    this.frame = requestAnimationFrame(this.render.bind(this))
  }

  // Stops the render loop and releases listeners and GPU resources, so a new scene can take over.
  destroy () {
    this.stop = true
    cancelAnimationFrame(this.frame)
    window.removeEventListener('resize', this.onResize)
    this.modal.removeEventListener('click', this.onModalClick)
    this.imageStore.forEach(({ img, onClick, material, texture }) => {
      img.removeEventListener('click', onClick)
      texture.dispose()
      material.dispose()
    })
    this.tlOn?.kill()
    this.disappearTl?.kill()
    this.restoreTl?.kill()
    this.asscroll.scrollTo(0)
    this.asscroll.disable()
    this.asscroll = null
    window.scrollTo(0, 0)
    this.geometry.dispose()
    this.material.dispose()
    this.renderer.dispose()
    this.container.innerHTML = ''
    this.imageStore = []
    this.materials = []
    this.images = undefined
    this.modal = undefined
    while(this.scene.children.length > 0){
      this.scene.remove(this.scene.children[0]);
    }
  }
}





