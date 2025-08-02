import { useEffect, useMemo, useRef, useState } from 'react'
import {
    Container,
    ListGroup,
    Row,
    Col,
    Form,
    Accordion,
    Image,
    Spinner,
    Badge,
} from 'react-bootstrap'
import { useInfiniteQuery, type InfiniteData } from '@tanstack/react-query'
import { getBooksList, type GetBooksListProps } from '../http/booksListAPI'
import { useDebouncedValue } from '../hooks/useDebouncedValue'

export interface Book {
    id: number
    isbn: string
    title: string
    author: string[]
    publisher: string
    image: string
    likes: number
    reviewsCount: number
    reviews: { author: string; text: string }[]
}

interface BooksPage {
    books: Book[]
    hasMore: boolean
    nextPage: number
}

const HomePage = () => {
    const observerRef = useRef<HTMLDivElement | null>(null)

    const [formData, setFormData] = useState<GetBooksListProps>({
        page: '1',
        language: 'en',
        seed: '553218',
        likesCount: '5.0',
        reviewsCount: '3.0',
    })

    const handleChange = <K extends keyof GetBooksListProps>(
        field: K,
        value: GetBooksListProps[K]
    ) => {
        setFormData((prev) => ({ ...prev, [field]: String(value) }))
    }

    const debouncedFormData = useDebouncedValue(formData, 1000)
    const queryKey: [string, GetBooksListProps] = useMemo(
        () => ['books', debouncedFormData],
        [debouncedFormData]
    )

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        status,
        error,
    } = useInfiniteQuery<
        BooksPage,
        Error,
        InfiniteData<BooksPage>,
        [string, GetBooksListProps],
        number
    >({
        queryKey,
        queryFn: async ({ pageParam = 1 }) => {
            const response = await getBooksList({
                ...formData,
                page: String(pageParam),
            })
            return {
                books: response.books ?? [],
                hasMore: response.hasMore ?? false,
                nextPage: pageParam + 1,
            }
        },
        retry: 1,
        getNextPageParam: (lastPage) =>
            lastPage.hasMore ? lastPage.nextPage : undefined,
        initialPageParam: 1,
    })

    const isFetchingRef = useRef(false)

    useEffect(() => {
        if (!observerRef.current) return

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (
                    entry.isIntersecting &&
                    hasNextPage &&
                    !isFetchingRef.current
                ) {
                    isFetchingRef.current = true
                    fetchNextPage().finally(() => {
                        isFetchingRef.current = false
                    })
                }
            },
            { threshold: 1 }
        )

        observer.observe(observerRef.current)

        return () => observer.disconnect()
    }, [hasNextPage, fetchNextPage])

    const allBooks = useMemo(() => {
        return data?.pages.flatMap((page) => page.books) ?? []
    }, [data])

    return (
        <Container className="py-4">
            <h1 className="mb-4 text-center">Book List</h1>
            <Form className="mb-4">
                <Row className="gy-2 gx-3">
                    <Col xs={12} md={3}>
                        <Form.Group>
                            <Form.Label>Language</Form.Label>
                            <Form.Select
                                value={formData.language}
                                onChange={(e) =>
                                    handleChange('language', e.target.value)
                                }
                            >
                                <option value="en">English</option>
                                <option value="ru">Russian</option>
                                <option value="ja">Japanese</option>
                            </Form.Select>
                        </Form.Group>
                    </Col>

                    <Col xs={12} md={3}>
                        <Form.Group>
                            <Form.Label>Seed</Form.Label>
                            <Form.Control
                                type="number"
                                value={formData.seed}
                                onChange={(e) =>
                                    handleChange('seed', e.target.value)
                                }
                            />
                        </Form.Group>
                    </Col>

                    <Col xs={12} md={3}>
                        <Form.Group>
                            <Form.Label>Likes</Form.Label>
                            <Form.Range
                                min={0}
                                max={10}
                                step={0.1}
                                value={formData.likesCount}
                                onChange={(e) =>
                                    handleChange('likesCount', e.target.value)
                                }
                            />
                            <Form.Text>
                                Selected: {formData.likesCount}
                            </Form.Text>
                        </Form.Group>
                    </Col>

                    <Col xs={12} md={3}>
                        <Form.Group>
                            <Form.Label>Reviews</Form.Label>
                            <Form.Control
                                type="number"
                                step={0.1}
                                value={formData.reviewsCount}
                                onChange={(e) => {
                                    const rounded =
                                        Math.round(
                                            parseFloat(e.target.value) * 10
                                        ) / 10
                                    handleChange(
                                        'reviewsCount',
                                        String(rounded)
                                    )
                                }}
                            />
                        </Form.Group>
                    </Col>
                </Row>
            </Form>

            <ListGroup variant="flush">
                <ListGroup.Item className="fw-bold bg-light mb-1">
                    <Row>
                        <Col xs={1}>ID</Col>
                        <Col xs={2}>ISBN</Col>
                        <Col xs={3}>Title</Col>
                        <Col xs={4}>Author(s)</Col>
                        <Col xs={2}>Publisher</Col>
                    </Row>
                </ListGroup.Item>
                {allBooks.map((book: Book) => (
                    <Accordion key={book.id} className="mb-2">
                        <Accordion.Item eventKey="0">
                            <Accordion.Header>
                                <Row className="w-100 fw-medium">
                                    <Col className="fw-bold" xs={1}>
                                        {book.id}
                                    </Col>
                                    <Col xs={2}>{book.isbn}</Col>
                                    <Col xs={3}>{book.title}</Col>
                                    <Col xs={4}>{book.author.join(', ')}</Col>
                                    <Col xs={2}>{book.publisher}</Col>
                                </Row>
                            </Accordion.Header>
                            <Accordion.Body>
                                <Row className="mb-3">
                                    <Col xs={12} md={3}>
                                        <div
                                            className="w-100 h-100 img-bg d-flex justify-content-center align-content-center"
                                            style={{
                                                maxWidth: 300,
                                                maxHeight: 400,
                                            }}
                                        >
                                            {book.image && (
                                                <Image
                                                    className="w-100 h-100"
                                                    style={{
                                                        maxWidth: 300,
                                                        maxHeight: 400,
                                                        objectFit: 'cover',
                                                    }}
                                                    src={book.image || 'img_default.png'}
                                                    alt="Book cover"
                                                    fluid
                                                    rounded
                                                    onError={(e) => {
                                                        const target = e.target as HTMLImageElement;
                                                        target.onerror = null;
                                                        target.src = 'img_default.png';
                                                    }}
                                                />

                                            )}
                                        </div>
                                    </Col>
                                    <Col xs={12} md={8}>
                                        <h5>{book.title}</h5>
                                        <p>
                                            <strong>By:</strong>{' '}
                                            {book.author.join(', ')}
                                        </p>
                                        <p>{book.publisher}</p>
                                        <Badge
                                            bg="info"
                                            className="d-inline-flex align-items-center px-2 py-1 mb-3"
                                            style={{
                                                borderRadius: '0.5rem',
                                                fontSize: '0.9rem',
                                            }}
                                        >
                                            <svg
                                                style={{ marginRight: 4 }}
                                                width="20px"
                                                height="20px"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                xmlns="http://www.w3.org/2000/svg"
                                            >
                                                <path
                                                    d="M20.2699 16.265L20.9754 12.1852C21.1516 11.1662 20.368 10.2342 19.335 10.2342H14.1539C13.6404 10.2342 13.2494 9.77328 13.3325 9.26598L13.9952 5.22142C14.1028 4.56435 14.0721 3.892 13.9049 3.24752C13.7664 2.71364 13.3545 2.28495 12.8128 2.11093L12.6678 2.06435C12.3404 1.95918 11.9831 1.98365 11.6744 2.13239C11.3347 2.29611 11.0861 2.59473 10.994 2.94989L10.5183 4.78374C10.3669 5.36723 10.1465 5.93045 9.86218 6.46262C9.44683 7.24017 8.80465 7.86246 8.13711 8.43769L6.69838 9.67749C6.29272 10.0271 6.07968 10.5506 6.12584 11.0844L6.93801 20.4771C7.0125 21.3386 7.7328 22 8.59658 22H13.2452C16.7265 22 19.6975 19.5744 20.2699 16.265Z"
                                                    fill="#1C274C"
                                                />
                                                <path
                                                    fill-rule="evenodd"
                                                    clip-rule="evenodd"
                                                    d="M2.96767 9.48508C3.36893 9.46777 3.71261 9.76963 3.74721 10.1698L4.71881 21.4063C4.78122 22.1281 4.21268 22.7502 3.48671 22.7502C2.80289 22.7502 2.25 22.1954 2.25 21.5129V10.2344C2.25 9.83275 2.5664 9.5024 2.96767 9.48508Z"
                                                    fill="#1C274C"
                                                />
                                            </svg>
                                            {book.likes}
                                        </Badge>
                                        <h5>Reviews</h5>
                                        <ListGroup variant="flush">
                                            {book.reviews.length > 0 ? (
                                                book.reviews.map(
                                                    (review, index) => (
                                                        <ListGroup.Item
                                                            key={index}
                                                        >
                                                            <strong>
                                                                {review.author}
                                                            </strong>
                                                            : {review.text}
                                                        </ListGroup.Item>
                                                    )
                                                )
                                            ) : (
                                                <ListGroup.Item>
                                                    No reviews
                                                </ListGroup.Item>
                                            )}
                                        </ListGroup>
                                    </Col>
                                </Row>
                            </Accordion.Body>
                        </Accordion.Item>
                    </Accordion>
                ))}
                {status === 'error' && (
                    <div className="text-danger text-center my-3">
                        Ошибка загрузки данных: {error?.message}
                    </div>
                )}
                {status === 'pending' && (
                    <div className="text-center my-3">
                        <Spinner animation="border" />
                    </div>
                )}
            </ListGroup>
            <div ref={observerRef} style={{ height: '1px' }} />
            {isFetchingNextPage && (
                <div className="text-center my-3">
                    <Spinner animation="border" />
                </div>
            )}
        </Container>
    )
}

export default HomePage
