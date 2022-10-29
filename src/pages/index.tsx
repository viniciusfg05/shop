import { CardConteinerStyled, HomeContainerStyled, ProductStyled } from "../styles/pages/Home"
import { useKeenSlider } from "keen-slider/react" // Slider
import Head from 'next/head'
import Link from "next/link"
import "keen-slider/keen-slider.min.css" // Slider - CSS
import Image from "next/future/image"
import { stripe } from "../lib/stripe"
import { GetStaticProps } from "next"
import Stripe from "stripe"
import { CaretLeft, CaretRight, Handbag } from "phosphor-react"
import { useContext, useEffect, useState } from "react"
import axios from "axios"
import router from "next/router"
import { IgniteShopContext } from "../context/ContextApi"

interface HomeProps {
  products: {
    id: string;
    name: string;
    imageUrl: string;
    url: string;
    price: number;
    defaultPriceId: string
  }[]
  productSelectData: {
    id: string;
    name: string;
    imageUrl: string;
    url: string;
    price: number;
    description: string
    defaultPriceId: string
  }
}



export default function Home({ products, productSelectData }: HomeProps) {
  const [card, setCard] = useState([])
  const [loaded, setLoaded] = useState(false)
  const [currentSlide, setCurrentSlide] = useState(0)
  const { setCardFunction } = useContext(IgniteShopContext)

  const [sliderRef, instanceRef] = useKeenSlider<HTMLDivElement>({
    initial: 0,
    slideChanged(slider) {
      setCurrentSlide(slider.track.details.rel)
    },
    slides: {
      perView: 3,
      spacing: 48,
    },
    created() {
      setLoaded(true)
    },
  })

  async function handleBuyProduct(data) {
    setCardFunction(data)
  }

  const priceFormatter = new Intl.NumberFormat('pt-BR', {
    style: "currency",
    currency: "BRL"
  })

  function Arrow(props: {
    disabled: boolean
    left?: boolean
    onClick: (e: any) => void
  }) {
    const disabeld = props.disabled ? " arrow--disabled" : ""
    return (
      <svg
        onClick={props.onClick}
        className={`arrow ${props.left ? "arrow--left" : "arrow--right"
          } ${disabeld}`}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
      >
        {props.left && (
          <path d="M16.67 0l2.83 2.829-9.339 9.175 9.339 9.167-2.83 2.829-12.17-11.996z" />
        )}
        {!props.left && (
          <path d="M5 3l3.057-3 11.943 12-11.943 12-3.057-3 9-9z" />
        )}
      </svg>
    )
  }

  console.log(currentSlide)

  return (
    <>
      <Head>
        <title>Home | Ignite Shop</title>
      </Head>

      <HomeContainerStyled ref={sliderRef} className="keen-slider">
        {products.map(product => (
          <ProductStyled key={product.id} className="keen-slider__slide">
            <Link href={`product/${product.id}`} prefetch={false}>
              <Image src={product.imageUrl} width={520} height={480} alt="" />
            </Link>

            <footer>
              <header>
                <strong>{product.name}</strong>
                <span>{priceFormatter.format(product.price)}</span>
              </header>

              <CardConteinerStyled onClick={() => handleBuyProduct(product)}>
                <Handbag color="#fff" size={32} weight="bold" />
              </CardConteinerStyled>
            </footer>

            <>
              {instanceRef.current && (
                <>


                  { currentSlide === 0  ? (
                    <Arrow
                    onClick={(e: any) =>
                        e.stopPropagation() || instanceRef.current?.next()
                      }
                      disabled={
                        currentSlide ===
                        instanceRef.current.track.details.slides.length - 1
                      }
                      />
                      ) : (
                        
                          <Arrow
                            left
                            onClick={(e: any) =>
                              e.stopPropagation() || instanceRef.current?.prev()
                            }
                            disabled={currentSlide === 0 ?  true : false}
                          />
                  )}
                </>
              )}
            </>

            <>
              {loaded && instanceRef.current && (
                <div className="dots">
                  {[
                    ...Array(instanceRef.current.track.details.slides.length).keys(),
                  ].map((idx) => {
                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          instanceRef.current?.moveToIdx(idx)
                        }}
                        className={"dot" + (currentSlide === idx ? " active" : "")}
                      ></button>
                    )
                  })}
                </div>
              )}
            </>
          </ProductStyled>
        ))}
      </HomeContainerStyled>
    </>
  )
}


export const getStaticProps: GetStaticProps<any, { id: string }> = async ({ params }) => {
  const response = await stripe.products.list({
    expand: ["data.default_price"]
  })

  const products = response.data.map(product => {

    const price = product.default_price as Stripe.Price

    console.log(price.id)

    return {
      id: product.id,
      name: product.name,
      imageUrl: product.images[0],
      url: product.url,
      price: price.unit_amount / 100,
      defaultPriceId: price.id,
    }

  })

  return {
    props: {
      products,
    },
    revalidate: 60 * 60 * 2 // 2 horas
  }
}